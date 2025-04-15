import json
import os
import zipfile

import boto3

s3_client = boto3.client("s3")


def handler(event, context):
    print(f"Received event: {json.dumps(event)}")

    try:
        # S3 イベントからバケット名とオブジェクトキーを取得
        bucket_name = event["Records"][0]["s3"]["bucket"]["name"]
        object_key = event["Records"][0]["s3"]["object"]["key"]

        # 一時ディレクトリを作成 (Lambda 環境の一時ストレージは /tmp)
        tmp_dir = "/tmp/extracted"
        os.makedirs(tmp_dir, exist_ok=True)

        # S3 から zip ファイルをダウンロードして一時ファイルとして保存
        download_path = f"/tmp/{object_key}"
        s3_client.download_file(bucket_name, object_key, download_path)

        # zip ファイルを解凍
        with zipfile.ZipFile(download_path, "r") as zip_ref:
            zip_ref.extractall(tmp_dir)

        # 解凍したファイルをアップロード
        for file_name in os.listdir(tmp_dir):
            file_path = os.path.join(tmp_dir, file_name)
            if os.path.isfile(file_path):
                s3_client.upload_file(file_path, bucket_name, f"extracted/{file_name}")

        return f"Processing object: s3://{bucket_name}/{object_key}"
    except Exception as e:
        print(f"Error processing event: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps(f"Error processing: {str(e)}"),
        }
