---
title: "CLI Profile (SSO)"
description: "Configure AWS Bedrock to use AWS CLI profiles for authentication with Trumbo. Best for SSO/federated roles and secure enterprise access."
---
### Overview

Trumbo can use AWS credentials or AWS profiles to access AWS Bedrock services. SSO/Federated roles are recommended over legacy IAM configuration; this guide walks through configuring your environment so Trumbo authenticates with SSO roles.

---

### Configuration Steps

1. Install the [latest version](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) of the AWS CLI.

    - Follow the AWS docs to install the OS-specific version of the AWS CLI.

2. [Configure IAM authentication](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html) with the AWS CLI.

    - If you don't already have AWS access through the IAM Identity Center, follow the [IAM User Guide](https://docs.aws.amazon.com/singlesignon/latest/userguide/getting-started.html) to set up IAM users and roles. Make sure you have a `PowerUserAccess` role.
    - If you have AWS access through your employer, open your AWS access portal and find the appropriate account. Make sure you have `PowerUserAccess` permissions.
    - Open the `Access keys` link and note the `SSO start URL` and `SSO region`, which you'll need in the next step.

3. Continue configuring your profile using [the `aws configure sso` CLI wizard](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html#cli-configure-sso-configure).

    - Once configured, authenticate the AWS CLI with: `aws sso login --profile `
    - Note the profile name you attach to your AWS account — you'll need it to configure Trumbo in the next steps.

4. If you haven't already, install VS Code and the Trumbo extension. See the [Getting Started](../../getting-started/installing-trumbo) page for guidance.

5. Open the Trumbo extension, then click the settings button ⚙️ to select your API Provider.
    - From the API Provider dropdown, select AWS Bedrock.
    - Select the AWS Profile radio button, then enter the AWS Profile Name from step 3.
    - Select your AWS Region from the dropdown menu.
    - Selecting the cross-region inference checkbox is required for some models.
