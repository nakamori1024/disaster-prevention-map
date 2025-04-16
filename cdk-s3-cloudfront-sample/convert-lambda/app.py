import json
import os
import zipfile

import boto3
import fiona

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

        for file_name in os.listdir(tmp_dir):
            if file_name.endswith(".shp"):
                # GeoPackageに変換
                convert_to_geopackage(
                    os.path.join(tmp_dir, file_name),
                    os.path.join(tmp_dir, file_name.replace(".shp", ".gpkg")),
                )

                # GeoPackageをS3にアップロード
                s3_client.upload_file(
                    os.path.join(tmp_dir, file_name.replace(".shp", ".gpkg")),
                    bucket_name,
                    f"converted/{file_name.replace('.shp', '.gpkg')}",
                )

        return f"Processing object: s3://{bucket_name}/{object_key}"
    except Exception as e:
        print(f"Error processing event: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps(f"Error processing: {str(e)}"),
        }


def convert_to_geopackage(input_file, output_file):
    """
    Convert a shapefile to GeoPackage format.
    """
    with fiona.open(input_file, "r") as src:
        profile = src.profile
        profile.update(driver="GPKG", crs=src.crs)
        with fiona.open(output_file, "w", **profile) as dst:
            for feature in src:
                dst.write(feature)


if __name__ == "__main__":
    # file directory
    dir_path = os.path.dirname(os.path.abspath(__file__))

    # shp
    shp_file = os.path.join(dir_path, "test_data", "N03-20240101_14.shp")

    # gpkg
    gpkg_file = os.path.join(dir_path, "test_data", "N03-20240101_14.gpkg")

    convert_to_geopackage(shp_file, gpkg_file)
