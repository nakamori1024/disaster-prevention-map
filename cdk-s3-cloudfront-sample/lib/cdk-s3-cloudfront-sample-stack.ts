// lib/cdk-s3-cloudfront-sample-stack.ts

import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// S3関連のモジュールをインポート
import * as s3 from 'aws-cdk-lib/aws-s3';
// BlockPublicAccess クラスもインポート
import { BlockPublicAccess, BucketEncryption } from 'aws-cdk-lib/aws-s3';
// CloudFront関連のインポート
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
// Lambda関連のインポートを追加
// import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as lambda from 'aws-cdk-lib/aws-lambda';
// S3イベントソースをインポート
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

// クラス名がファイル名と一致しているはずです
export class CdkS3CloudfrontSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkS3CloudfrontSampleQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    // 1. S3バケットの作成
    const myBucket = new s3.Bucket(this, 'MySampleBucket', {
      // バケット名はCDKが自動生成

      // CloudFrontからのアクセスのみを許可するため、パブリックアクセスはブロック
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,

      // スタック削除時にバケットを削除し、オブジェクトも自動削除する (テスト用に便利)
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,

      // 暗号化を有効にする
      encryption: BucketEncryption.S3_MANAGED,
    });

    // --- ここから追加 ---

    // 2. CloudFront ディストリビューションの作成
    const myDistribution = new cloudfront.Distribution(this, 'MySampleDistribution', {
      // デフォルトのルートオブジェクト
      defaultRootObject: 'index.html',

      // デフォルトのビヘイビア設定
      defaultBehavior: {
        // オリジンとしてS3バケットを指定 (OAC設定も自動)
        origin: new origins.S3Origin(myBucket),

        // 許可/キャッシュするHTTPメソッド
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        // 圧縮を有効化
        compress: true,
        // HTTPSへリダイレクト
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    // 3. Lambda関数の作成
    const dockerfileDirectory = path.join(__dirname, '..', 'convert-lambda');
    const dockerLambda = new lambda.DockerImageFunction(this, 'ConvertLambda', {
      code: lambda.DockerImageCode.fromImageAsset(dockerfileDirectory),
      architecture: lambda.Architecture.X86_64,
      memorySize: 512,
      timeout: cdk.Duration.seconds(60)
    })

    // 4. Lambda関数にS3バケットへのアクセス権限を付与
    myBucket.grantReadWrite(dockerLambda);

    // 5. Lambda関数にS3バケットのイベント通知を設定
    dockerLambda.addEventSource(new S3EventSource(myBucket, {
      events: [s3.EventType.OBJECT_CREATED],  // オブジェクト作成時にトリガー
      filters: [{suffix: '.zip'}]  // ZIPファイルのみ
    }));

    // --- 出力 (Outputs) ---

    // 作成されたS3バケット名
    new cdk.CfnOutput(this, 'BucketName', {
      value: myBucket.bucketName,
      description: 'Name of the S3 bucket created',
    });

    // CloudFront ディストリビューションのドメイン名 (アクセス用URL)
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: myDistribution.distributionDomainName,
      description: 'Domain name of the CloudFront distribution',
    });

    // CloudFront ディストリビューションのID
    new cdk.CfnOutput(this, 'DistributionId', {
        value: myDistribution.distributionId,
        description: 'ID of the CloudFront distribution',
    });

    // Lambda関数の名前
    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: dockerLambda.functionName,
      description: 'Name of the Lambda function created',
    })

  }
}