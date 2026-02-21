# Deployment setup: GitHub + AWS (snippets.davidwellsthedeveloper.com)

Use this checklist with your actual values. **Do not commit AWS keys or GitHub tokens**; add them only in GitHub Secrets and AWS IAM.

---

## Your values (copy these where needed)

| What | Value |
|------|--------|
| **Domain** | `davidwellsthedeveloper.com` |
| **Subdomain (live site)** | `snippets.davidwellsthedeveloper.com` |
| **GitHub username** | `DavidWellsTheDeveloper` |
| **GitHub repo** | `https://github.com/DavidWellsTheDeveloper/audio-snippet-player` |
| **Suggested S3 bucket name** | `snippets-davidwellsthedeveloper-com` (must be globally unique; try this or add a suffix like `-prod`) |
| **ACM certificate domain** | `snippets.davidwellsthedeveloper.com` |
| **Route 53 record name** | `snippets` (in hosted zone for `davidwellsthedeveloper.com`) |

---

## 1. GitHub

### Create repo (if not done)

1. GitHub → **Repositories** → **New**.
2. Name: **audio-snippet-player**.
3. Public or Private. Do **not** add README / .gitignore / license.
4. **Create repository**.

### Push code (from project root)

```bash
cd /home/dave/dev/sandbox/audio-snippet-player

# If not a git repo yet:
git init
git add .
git commit -m "Initial commit"

# Add remote (HTTPS)
git remote add origin https://github.com/DavidWellsTheDeveloper/audio-snippet-player.git

# Or with SSH:
# git remote add origin git@github.com:DavidWellsTheDeveloper/audio-snippet-player.git

git branch -M master
git push -u origin master
```

(If you already have a remote, use `git remote set-url origin ...` instead of `add`.)

### Secrets and variables (after AWS steps below)

Repo → **Settings** → **Secrets and variables** → **Actions**:

- **Secrets**
  - `AWS_ACCESS_KEY_ID` = IAM access key ID
  - `AWS_SECRET_ACCESS_KEY` = IAM secret access key
- **Variables**
  - `S3_BUCKET` = your S3 bucket name (e.g. `snippets-davidwellsthedeveloper-com`)
  - `CLOUDFRONT_DISTRIBUTION_ID` = CloudFront distribution ID (e.g. `E2XXXXXXXXXXXX`)
- **Variables** (optional)
  - `AWS_REGION` = `us-east-1` (workflow defaults to this if unset)

---

## 2. AWS (order matters)

### A. S3 bucket

1. **S3** → **Create bucket**.
2. Bucket name: e.g. **snippets-davidwellsthedeveloper-com** (globally unique).
3. Region: **us-east-1**.
4. **Block all public access** = On. Create bucket.

### B. ACM certificate (must be in us-east-1)

1. Switch region to **US East (N. Virginia)**.
2. **Certificate Manager** → **Request certificate**.
3. **snippets.davidwellsthedeveloper.com**; DNS validation; request.
4. **Create records in Route 53** (or add the CNAME manually in your hosted zone).
5. Wait until status **Issued**.

### C. CloudFront distribution

1. **CloudFront** → **Create distribution**.
2. **Origin**: Select your S3 bucket → **Origin access**: Create new **Origin access control** → Create. When prompted, **copy the bucket policy** and apply it in S3 → bucket → Permissions → Bucket policy.
3. **Default root object**: `index.html`.
4. **Alternate domain name (CNAME)**: **snippets.davidwellsthedeveloper.com**.
5. **Custom SSL certificate**: Select the ACM cert for `snippets.davidwellsthedeveloper.com`.
6. **Error pages**: Add custom error response **403** → path `/index.html`, response **200**. Add **404** → path `/index.html`, response **200**.
7. **Price class**: e.g. “Use only North America and Europe”.
8. Create distribution. Copy the **Distribution ID** (e.g. `E2XXXXXXXXXXXX`) for GitHub variable `CLOUDFRONT_DISTRIBUTION_ID`.

### D. Route 53 A record

1. **Route 53** → **Hosted zones** → **davidwellsthedeveloper.com**.
2. **Create record**:
   - Name: **snippets**
   - Type: **A**
   - Alias: **On** → **Alias to CloudFront distribution** → select your distribution.
3. Create record.

### E. IAM user for GitHub Actions

1. **IAM** → **Users** → **Create user** → e.g. **github-actions-audio-snippet-player**; no console login.
2. **Create policy** (JSON), replace `YOUR_BUCKET_NAME` and `YOUR_DISTRIBUTION_ID` and `YOUR_ACCOUNT_ID`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
    }
  ]
}
```

3. Attach policy to the user. **Create access key** → use case “Application running outside AWS”.
4. Copy **Access key ID** and **Secret access key** → add as GitHub Secrets (see above). You cannot view the secret again.

---

## 3. Deploy

1. Ensure GitHub **Secrets** and **Variables** are set.
2. Push to **master** (or re-run the “Deploy to AWS” workflow from the **Actions** tab).

After the workflow succeeds, the site is at **https://snippets.davidwellsthedeveloper.com**.
