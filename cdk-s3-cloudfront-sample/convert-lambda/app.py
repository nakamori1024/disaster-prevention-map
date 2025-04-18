import json
import os
import subprocess
import zipfile
from typing import Literal

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

        return f"Processing object: s3://{bucket_name}/{object_key}"
    except Exception as e:
        print(f"Error processing event: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps(f"Error processing: {str(e)}"),
        }


def convert_data_type(input_file, output_file, driver: Literal["GeoJSON", "GPKG"]):
    """
    Convert a shapefile to GeoJSON or GeoPackage format.
    """
    with fiona.open(input_file, "r") as src:
        profile = src.profile
        profile.update(driver=driver, crs=src.crs)
        with fiona.open(output_file, "w", **profile) as dst:
            for feature in src:
                dst.write(feature)


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
    except subprocess.CalledProcessError as e:
        print(f"Error converting to PMTiles: {e}")
        print(f"Standard Output: {e.stdout}")
        print(f"Standard Error: {e.stderr}")
        raise
    except FileNotFoundError as e:
        print(f"tippecanoe not found: {e}")
        raise


if __name__ == "__main__":
    # file directory
    dir_path = os.path.dirname(os.path.abspath(__file__))

    # shp
    shp_file = os.path.join(dir_path, "test_data", "N03-20240101_14.shp")

    # gpkg
    gpkg_file = os.path.join(dir_path, "test_data", "N03-20240101_14.gpkg")

    # geojson
    geojson_file = os.path.join(dir_path, "test_data", "N03-20240101_14.geojson")

    convert_data_type(shp_file, geojson_file, "GeoJSON")
