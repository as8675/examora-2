# Examora

## Setup Instructions

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure AWS Credentials**

   Bedrock functionality requires AWS credentials. You have three options:

   **Option A: Environment Variables (Recommended for Development)**
   
   Create a `.env` file in the `backend` directory:
   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key-id-here
   AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
   COGNITO_USER_POOL_ID=your-user-pool-id-here
   ```
   
   Copy `env.example` to `.env` and fill in your values:
   ```bash
   cp env.example .env
   # Then edit .env with your actual credentials
   ```

   **Option B: AWS Credentials File**
   
   Configure AWS CLI credentials:
   ```bash
   aws configure
   ```
   
   This creates `~/.aws/credentials` and `~/.aws/config` files.
   
   **Option C: IAM Role (For Production/EC2)**
   
   If running on EC2 or Lambda, use IAM roles instead of credentials.

3. **AWS Bedrock Setup**

   For Bedrock to work, ensure:
   
   - **AWS Account**: You have an active AWS account
   - **Bedrock Access**: Bedrock service is enabled in your AWS account
   - **Model Access**: Claude 3 Haiku model is enabled in Bedrock
     - Go to AWS Console → Bedrock → Model access
     - Request access to "Anthropic Claude 3 Haiku"
   - **IAM Permissions**: Your AWS credentials have the following permissions:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": [
             "bedrock:InvokeModel",
             "bedrock:InvokeModelWithResponseStream"
           ],
           "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
         },
         {
           "Effect": "Allow",
           "Action": [
             "textract:DetectDocumentText",
             "comprehend:DetectKeyPhrases"
           ],
           "Resource": "*"
         }
       ]
     }
     ```

4. **Verify AWS Credentials**
   
   Test your AWS setup:
   ```bash
   aws sts get-caller-identity
   ```
   
   This should return your AWS account ID and user ARN.

5. **Run the Backend Server**
   ```bash
   npm start
   # or
   node server.js
   ```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting Bedrock Issues

If Bedrock is not working:

1. **Check AWS Credentials**
   - Verify credentials are set: `aws sts get-caller-identity`
   - Ensure `.env` file exists and has correct values (if using environment variables)
   - Check AWS credentials file exists: `~/.aws/credentials`

2. **Verify Bedrock Access**
   - Log into AWS Console → Bedrock → Model access
   - Confirm "Anthropic Claude 3 Haiku" shows as "Access granted"
   - If not, click "Request model access" and wait for approval

3. **Check Region Configuration**
   - Ensure `AWS_REGION` in `.env` matches the region where Bedrock is enabled
   - Common regions: `us-east-1`, `us-east-2`, `us-west-2`

4. **Verify IAM Permissions**
   - Your IAM user/role needs `bedrock:InvokeModel` permission
   - Check IAM console for your user's permissions

5. **Test Bedrock Directly**
   ```bash
   aws bedrock-runtime invoke-model \
     --model-id anthropic.claude-3-haiku-20240307-v1:0 \
     --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":100,"messages":[{"role":"user","content":[{"type":"text","text":"Hello"}]}]}' \
     --region us-east-1 \
     output.json
   ```

6. **Check Console Logs**
   - Look for error messages in the backend console
   - Common errors:
     - `AccessDeniedException`: Check IAM permissions
     - `ValidationException`: Check model ID format
     - `UnrecognizedClientException`: Check AWS credentials

## Common Issues

- **"Credentials not found"**: Set up AWS credentials (see above)
- **"AccessDenied"**: Add Bedrock permissions to your IAM user
- **"Model not found"**: Enable Claude 3 Haiku in Bedrock console
- **"Invalid region"**: Ensure the region supports Bedrock


