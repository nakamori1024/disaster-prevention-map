import json
import logging
import os
import subprocess
import zipfile
from typing import Literal

import boto3
import fiona

# --- ロガー設定 ---
# より詳細な情報を含むログフォーマットに変更
formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s (%(aws_request_id)s)"
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
# Lambdaが設定するハンドラにカスタムフォーマッタを適用 (既にハンドラがあれば)
if len(logging.getLogger().handlers) > 0:
    logging.getLogger().handlers[0].setFormatter(formatter)
else:  # ローカル実行時などハンドラがない場合
    handler_stream = logging.StreamHandler()
    handler_stream.setFormatter(formatter)
    logger.addHandler(handler_stream)

s3_client = boto3.client("s3")


def handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")

    try:
        # S3 イベントからバケット名とオブジェクトキーを取得
        bucket_name = event["Records"][0]["s3"]["bucket"]["name"]
        object_key = event["Records"][0]["s3"]["object"]["key"]
        logger.info(f"Processing bucket: {bucket_name}, key: {object_key}")

        # 一時ディレクトリを作成 (Lambda 環境の一時ストレージは /tmp)
        tmp_dir = "/tmp/extracted"
        os.makedirs(tmp_dir, exist_ok=True)
        logger.info(f"Created temporary directory: {tmp_dir}")

        # S3 から zip ファイルをダウンロードして一時ファイルとして保存
        download_path = f"/tmp/{object_key}"
        s3_client.download_file(bucket_name, object_key, download_path)
        logger.info(f"Downloading file to: {download_path}")

        # zip ファイルを解凍
        logger.info("Extracting zip file...")
        with zipfile.ZipFile(download_path, "r") as zip_ref:
            zip_ref.extractall(tmp_dir)

        # 解凍されたファイルの確認
        files = os.listdir(tmp_dir)
        logger.info(f"Extracted files: {files}")

        for file_name in os.listdir(tmp_dir):
            if file_name.endswith(".shp"):
                # GeoPackageに変換
                convert_data_type(
                    os.path.join(tmp_dir, file_name),
                    os.path.join(tmp_dir, file_name.replace(".shp", ".gpkg")),
                    "GPKG",
                )

                # GeoPackageをS3にアップロード
                s3_client.upload_file(
                    os.path.join(tmp_dir, file_name.replace(".shp", ".gpkg")),
                    bucket_name,
                    f"streaming_data/gpkg/{file_name.replace('.shp', '.gpkg')}",
                )

                # GeoJSONに変換
                convert_data_type(
                    os.path.join(tmp_dir, file_name),
                    os.path.join(tmp_dir, file_name.replace(".shp", ".geojson")),
                    "GeoJSON",
                )

                # GeoJSONをS3にアップロード
                s3_client.upload_file(
                    os.path.join(tmp_dir, file_name.replace(".shp", ".geojson")),
                    bucket_name,
                    f"streaming_data/geojson/{file_name.replace('.shp', '.geojson')}",
                )

                # tippecanoeを使用してPMTilesに変換
                convert_to_pmtiles(
                    os.path.join(tmp_dir, file_name.replace(".shp", ".geojson")),
                    os.path.join(tmp_dir, file_name.replace(".shp", ".pmtiles")),
                    layer_name=file_name.replace(".shp", ""),
                )

                # PMTilesをS3にアップロード
                s3_client.upload_file(
                    os.path.join(tmp_dir, file_name.replace(".shp", ".pmtiles")),
                    bucket_name,
                    f"streaming_data/pmtiles/{file_name.replace('.shp', '.pmtiles')}",
                )

        logger.info("Processing completed successfully")

        return {
            "statusCode": 200,
            "body": json.dumps(f"Processing object: s3://{bucket_name}/{object_key}"),
        }
    except Exception as e:
        logger.error(f"Error processing event: {str(e)}", exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps(f"Error processing: {str(e)}"),
        }


def convert_data_type(input_file, output_file, driver: Literal["GeoJSON", "GPKG"]):
    """
    Convert a shapefile to GeoJSON or GeoPackage format.
    """
    logger.info(f"Converting {input_file} to {driver} format...")
    try:
        with fiona.open(input_file, "r") as src:
            profile = src.profile
            profile.update(driver=driver, crs=src.crs)
            with fiona.open(output_file, "w", **profile) as dst:
                for feature in src:
                    dst.write(feature)
        logger.info(f"Conversion to {driver} completed successfully")
    except Exception as e:
        logger.error(f"Error converting to {driver}: {str(e)}", exc_info=True)
        raise


def convert_to_pmtiles(input_file, output_file, layer_name="layer"):
    """
    Convert a GeoJSON file to PMTiles format using tippecanoe.
    """
    tippecanoe_options = [
        "tippecanoe",
        "-o",
        output_file,
        "--force",
        "-Z5",
        "-z14",
        "-l",
        layer_name,
        "--no-tile-compression",
        input_file,
    ]

    try:
        subprocess.run(tippecanoe_options, check=True, capture_output=True, text=True)
        logger.info("PMTiles conversion completed successfully")
    except subprocess.CalledProcessError as e:
        logger.error(f"Error converting to PMTiles: {str(e)}")
        logger.error(f"Standard Output: {e.stdout}")
        logger.error(f"Standard Error: {e.stderr}")
        raise
    except FileNotFoundError as e:
        logger.error(f"Tippecanoe not found: {str(e)}")
        raise


if __name__ == "__main__":
    # file directory
    dir_path = os.path.dirname(os.path.abspath(__file__))

    # shp
    shp_file = os.path.join(dir_path, "test_data", "hinanjo.shp")

    # gpkg
    gpkg_file = os.path.join(dir_path, "test_data", "hinanjo.gpkg")

    # geojson
    geojson_file = os.path.join(dir_path, "test_data", "hinanjo.geojson")

    convert_data_type(shp_file, geojson_file, "GeoJSON")
