import { defineBackend } from '@aws-amplify/backend';
import { Aspects, IAspect } from 'aws-cdk-lib';
import { CfnFunction } from 'aws-cdk-lib/aws-lambda';
import { IConstruct } from 'constructs';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
});

/**
 * New / Free-plan AWS accounts only allow Lambda functions up to 512 MB of memory.
 * Amplify's data backend creates a helper Lambda (CDK BucketDeployment) that asks for
 * 1536 MB, which made the deploy fail. This caps every Lambda in the backend at 512 MB.
 */
const MAX_LAMBDA_MEMORY_MB = 512;

class CapLambdaMemory implements IAspect {
  visit(node: IConstruct): void {
    if (
      node instanceof CfnFunction &&
      typeof node.memorySize === 'number' &&
      node.memorySize > MAX_LAMBDA_MEMORY_MB
    ) {
      node.memorySize = MAX_LAMBDA_MEMORY_MB;
    }
  }
}

Aspects.of(backend.data.stack.node.root).add(new CapLambdaMemory());
