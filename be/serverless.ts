import * as functions from "./src/functions";

import type { AWS } from "@serverless/typescript";

const gameActorLambdaName = `mmomok-dev-game`;

const serverlessConfiguration: AWS = {
  service: "mmomok",
  frameworkVersion: "2",
  custom: {
    webpack: {
      webpackConfig: "./webpack.config.js",
      includeModules: true,
    },
    prune: {
      automatic: true,
      number: 7,
    },
  },
  package: {
    individually: true,
  },
  plugins: [
    "serverless-webpack",
    "serverless-prune-plugin",
    "serverless-offline",
  ],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    region: "ap-northeast-2",
    stage: "dev",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      REDIS_HOST: process.env.REDIS_HOST!,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD!,
      WS_ENDPOINT: process.env.WS_ENDPOINT!,
      GAME_ACTOR_LAMBDA_NAME: gameActorLambdaName,
    },
    lambdaHashingVersion: "20201221",
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: ["lambda:InvokeFunction"],
            Resource: {
              "Fn::Join": [
                ":",
                [
                  "arn:aws:lambda",
                  { Ref: "AWS::Region" },
                  { Ref: "AWS::Account" },
                  "function",
                  gameActorLambdaName,
                ],
              ],
            },
          },
        ],
      },
    },
  },
  functions,
};

module.exports = serverlessConfiguration;
