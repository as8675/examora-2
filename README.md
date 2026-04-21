# Examora

Examora is an AI-powered coursework and professor-evaluation platform built on a highly available, serverless microservice architecture.

---

## 🏗️ Architecture Overview

This project has been transformed from a local application into a cloud-native platform utilizing AWS.

| Layer              | Technology                                                                          |
| ------------------ | ----------------------------------------------------------------------------------- |
| **Compute**        | Dockerized Node.js (Backend) & React (Frontend) on **AWS ECS with Fargate**         |
| **Networking**     | **Application Load Balancer (ALB)** across private subnets                          |
| **Database**       | **Amazon DynamoDB** - scalable, NoSQL data storage                                  |
| **Authentication** | **Amazon Cognito** - secure user registration & JWT token generation                |
| **AI Integration** | **Amazon Bedrock** (Anthropic Claude 3 Haiku) - contextual question generation      |
| **CI/CD Pipeline** | **AWS CodePipeline, CodeBuild & CodeDeploy** - Zero-Downtime Blue/Green deployments |

---

## 🚀 Deployment Workflow (CI/CD)

Deploying updates to Examora requires no manual server configuration. The entire infrastructure is managed via a fully automated CI/CD pipeline.

```bash
# 1. Make your changes locally
git commit -m "feat: your new feature"

# 2. Push to trigger the pipeline
git push
```

GitHub automatically triggers **AWS CodePipeline**. From there:

- **CodeBuild** compiles a fresh Docker image
- **CodeDeploy** spins up replacement containers and runs health checks
- **Load Balancer traffic** is shifted to the new version with **zero downtime**

### Managing Environment Variables in Production

Production environment variables (e.g. `COGNITO_USER_POOL_ID`, DynamoDB table names) are **not** stored in a `.env` file. They are securely injected at runtime via the `taskdef.json` file in the root of the repository.

---

## 🏗️ System Design & Architecture

Examora utilizes a modern, serverless microservice architecture designed for high availability, security, and zero-downtime deployments. The system is conceptually divided into two pipelines: the **Live Application Flow** (User Experience) and the **Automated CI/CD Pipeline** (Developer Experience).

### 1. The Live Application Flow

When a user interacts with Examora, the request travels through a secure, decoupled network:

- **Authentication (Amazon Cognito):** Before accessing core features, users authenticate via Cognito. Upon successful login, the client receives a secure JWT token required for all backend API access.
- **The Front Door (Application Load Balancer):** All web traffic hits an ALB deployed across private subnets. The ALB acts as a traffic cop, distributing incoming requests across healthy containers and terminating idle connections.
- **Serverless Compute (AWS ECS with Fargate):** The application logic runs within Dockerized microservices (React frontend and Node.js backend) orchestrated by ECS. Fargate abstracts the underlying hardware, providing on-demand compute that scales dynamically without managing EC2 instances.
- **AI Engine (Amazon Bedrock):** When a user requests question generation, the backend container securely invokes the Anthropic Claude 3 Haiku model via AWS Bedrock, passing in scraped professor and course data to synthesize contextual questions.
- **Data Persistence (Amazon DynamoDB):** All processed professor reviews, generated coursework, and system state are stored in a fully managed NoSQL DynamoDB table for rapid, single-digit millisecond retrieval.

### 2. CI/CD Pipeline (The Automation Engine)

Infrastructure updates and code deployments are entirely hands-off. Pushing to the repository triggers a fully automated assembly line:

- **Source (GitHub):** A webhook listens for commits to the `master` branch.
- **Orchestration (AWS CodePipeline):** Acts as the overarching manager, coordinating the flow of new code through the build and deployment phases.
- **Build Phase (AWS CodeBuild & ECR):** CodeBuild spins up a temporary build environment, compiles new Docker images from the latest `Dockerfile`, and pushes artifacts securely to the Amazon Elastic Container Registry (ECR).
- **Deployment Phase (AWS CodeDeploy):** Takes the new image from ECR and the updated `taskdef.json` blueprint, then orchestrates injection of the new container into the live ECS cluster.

### 3. Blue/Green Deployment Strategy (Zero-Downtime)

To ensure users never experience an outage or encounter broken code, Examora uses a strict Blue/Green deployment model:

1. CodeDeploy spins up the new **(Green)** container alongside the active **(Blue)** container in the background.
2. CodeDeploy injects the required runtime environment variables (Cognito IDs, DB Table Names).
3. The Load Balancer pings the new container with a health check.
4. **The Safe Swap:** If the health check passes, the ALB dynamically shifts 100% of live traffic to the new container and safely terminates the old one. If the health check fails (e.g., a fatal code error), CodeDeploy instantly destroys the new container and aborts the deployment. Live users remain completely unaffected.

### 4. Security & IAM (Least Privilege Architecture)

Examora does not rely on hardcoded AWS `.env` credentials in production. System access is governed by strict, decoupled IAM roles:

- **Task Execution Role (Infrastructure):** Grants the ECS service permission to pull Docker images from ECR and stream application logs to Amazon CloudWatch.
- **Task Role (Application):** The runtime badge. Grants the Node.js application explicit, limited permissions (`AmazonDynamoDBFullAccess` and `AmazonBedrockFullAccess`), allowing it to securely invoke AI models and persist data without exposing root access keys.

---

## 🔐 AWS Permissions & Security

Examora uses **IAM Roles** instead of hardcoded credentials in production.

### ECS Task Role

The `ecsTaskExecutionRole` (assigned as the **Task Role** in `taskdef.json`) must have the following IAM policies attached for the backend container to communicate with AWS services:

- `AmazonDynamoDBFullAccess` : to read/write scraped data
- `AmazonBedrockFullAccess` : to generate questions via Claude 3

### Bedrock Model Access

To use AI generation features, your AWS account must be granted access to the model:

1. Go to **AWS Console → Bedrock → Model access**
2. Confirm **Anthropic Claude 3 Haiku** is marked as **"Access granted"**

---

## 🛠️ Cloud Troubleshooting

If routes like `/scrape/professor` return a `500 Internal Server Error` while running in AWS, the cause is typically missing environment variables or insufficient IAM permissions.

### 1. Check ECS Logs

Navigate to **AWS Console → ECS → Clusters → Examora**, open your running Backend Task, and inspect the **Logs** tab. Look for errors such as `AccessDeniedException` or DynamoDB connection failures.

### 2. Verify `taskdef.json`

If you added a new third-party API or AWS service, ensure all required environment variables are listed in the `environment` array of `taskdef.json` before pushing.

### 3. Verify IAM Policies

If logs show an `AccessDenied` error for Bedrock or DynamoDB, confirm that the correct policies are attached to your ECS Task Role in the **IAM Console**.

### 4. CodeDeploy Health Check Failures

If a deployment fails and rolls back, CodeDeploy intercepted a crashing container. Check:

- **CodeBuild logs** — confirm the Docker image compiled successfully
- **ECS logs** — confirm the container isn't missing a required boot variable
