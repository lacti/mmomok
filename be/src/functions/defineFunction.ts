import type { AWS } from "@serverless/typescript";

type LambdaFunction = AWS["functions"][0];

export default function defineFunction(
  dirname: string,
  fn: LambdaFunction
): LambdaFunction {
  return {
    ...fn,
    handler: `${handlerPath(dirname)}/${fn.handler}`,
  };
}

function handlerPath(context: string) {
  return `${context.split(process.cwd())[1].substring(1).replace(/\\/g, "/")}`;
}
