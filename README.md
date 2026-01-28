# Equalify Hub

The central hub for the Equalify project – organizing documentation, open-source repositories, contribution guides, KPI reports, and support resources in one accessible place.

**Live at:** https://equalify.uic.edu

---

## Table of Contents

- [What is Equalify Hub?](#what-is-equalify-hub)
- [Deploy Your Own Instance](#deploy-your-own-instance)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Local Development](#local-development)
  - [AWS Lambda Deployment](#aws-lambda-deployment)
- [Configuration](#configuration)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [Project Ownership](#project-ownership)

---

## What is Equalify Hub?

Equalify Hub serves multiple audiences:

### For the Transition Team
- **Support documentation** – Centralized place for Equalify support (not just bugs)
- **KPI dashboards** – Track development progress and key metrics
- **Issue tracking** – Aggregate view of issues across all repositories

### For End Users
- **User documentation** – Learn how to use Equalify effectively
- **Support resources** – Find help and guidance

### For Contributors
- **Technical documentation** – API docs, code structure, architecture diagrams
- **Contribution guides** – How to contribute to Equalify projects
- **Repository overview** – Browse all EqualifyEverything repos

---

## Deploy Your Own Instance

Equalify Hub is designed to be deployed by other institutions running their own Equalify instance. Follow these steps to deploy your own Hub.

### Prerequisites

- Node.js 18+ and Yarn
- AWS account with Lambda and DynamoDB access
- A running Equalify application instance

### Environment Variables

The Hub uses environment variables for configuration. Copy `.env.example` to `.env` for local development, or set these as Lambda environment variables for production:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EQUALIFY_APP_URL` | Yes | `https://app.equalify.uic.edu` | The URL of your Equalify application. "Sign into Equalify" buttons will link here. |
| `SITE_NAME` | No | `Equalify Hub` | The display name for your Hub instance. |
| `GITHUB_ORG` | No | `EqualifyEverything` | The GitHub organization to display repos/issues from. |
| `FAVICON_URL` | No | `{EQUALIFY_APP_URL}/favicon.ico` | Custom favicon URL. |
| `ORG_LOGO_URL` | No | GitHub org avatar | Custom organization logo URL. |

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/EqualifyEverything/equalify-hub.git
   cd equalify-hub
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   yarn start
   ```
   
   This builds Tailwind CSS and starts the local server with hot reloading.

5. **Build for production**
   ```bash
   yarn build:css  # Build CSS only
   yarn build      # Full build and deploy to Lambda
   ```

### AWS Lambda Deployment

#### 1. Set up AWS resources

You'll need:
- **Lambda function** – Node.js 18+ runtime
- **DynamoDB table** – For feature requests and user data
- **API Gateway** – HTTP API or Function URL for web access

#### 2. Configure Lambda environment variables

In the AWS Lambda console, add these environment variables:

```
EQUALIFY_APP_URL=https://your-equalify-instance.com
SITE_NAME=Your Organization Hub
GITHUB_ORG=YourGitHubOrg
```

#### 3. Configure AWS CLI profile

Update `package.json` to use your AWS profile:

```json
{
  "scripts": {
    "sso": "aws sso login --profile your-profile",
    "build": "... --profile your-profile ..."
  }
}
```

#### 4. Deploy

```bash
# Authenticate with AWS
yarn sso

# Build and deploy
yarn build
```

This will:
1. Build Tailwind CSS
2. Bundle the application with esbuild
3. Create a Lambda deployment package
4. Upload to your Lambda function

---

## Configuration

### Customizing the Sign-In Link

The "Sign into Equalify" button appears throughout the Hub. To point it to your Equalify instance:

```bash
# In .env (local) or Lambda environment variables (production)
EQUALIFY_APP_URL=https://your-equalify-instance.com
```

### Customizing the Site Name

The site name appears in the header, footer, and page titles:

```bash
SITE_NAME=Acme Accessibility Hub
```

### Connecting to Your GitHub Organization

To display repositories and issues from your organization:

```bash
GITHUB_ORG=YourOrgName
```

---

## Tech Stack

- **TypeScript** – Type-safe development
- **Hono** – Lightweight web framework
- **AWS Lambda** – Serverless deployment
- **DynamoDB** – NoSQL database for feature requests
- **Tailwind CSS** – Utility-first styling
- **esbuild** – Fast bundling

---

## Contributing Documentation

Helen's team and other contributors can easily add documentation:

1. **Sign in with GitHub** – Must be part of the EqualifyEverything organization
2. **Create/edit Markdown files** – Standard markdown format
3. **Submit via GitHub** – Basic git operations only

---

## Project Ownership

Owned by Christopher Aitken as part of UIC's Digital Accessibility initiative.

**Key Contacts:**
- Christopher Aitken – Technical lead, Equalify Hub
- Jemma Ku – Oversight & integration with internal accessibility projects
- Blake & Trey – Equalify leadership

---

## License

MIT License – see [LICENSE](LICENSE) for details.
