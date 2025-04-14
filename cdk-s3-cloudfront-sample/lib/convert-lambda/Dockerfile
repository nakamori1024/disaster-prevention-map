FROM public.ecr.aws/lambda/python:3.9

COPY app.py ${LAMBDA_TASK_ROOT}

CMD [ "app.handler" ]


# # AWS Lambda Python 3.9 Runtime のベースイメージを使用
# FROM public.ecr.aws/lambda/python:3.9

# # 作業ディレクトリを設定
# WORKDIR /var/task

# # システムパッケージを更新し、GDALとTippecanoeのビルドに必要な依存関係をインストール
# RUN yum update -y && \
#     # EPELリポジトリを追加 (GDALなどの依存関係で必要になる場合がある)
#     amazon-linux-extras install epel -y && \

# # GDAL (ogr2ogrを含む) をインストール
# RUN yum install -y gdal

# Tippecanoe のビルドに必要なツールとライブラリをインストール
#     yum install -y make gcc gcc-c++ zlib-devel sqlite-devel curl tar gzip && \
#     # Tippecanoe の最新リリースのソースコードをダウンロードして展開
#     # (特定のバージョンを使いたい場合はURLやタグ名を変更してください)
#     export TIPPECANOE_VERSION=$(curl -s https://api.github.com/repos/mapbox/tippecanoe/releases/latest | grep tag_name | cut -d '"' -f 4) && \
#     echo "Installing Tippecanoe version: ${TIPPECANOE_VERSION}" && \
#     curl -sL "https://github.com/mapbox/tippecanoe/archive/refs/tags/${TIPPECANOE_VERSION}.tar.gz" -o tippecanoe.tar.gz && \
#     tar -zxvf tippecanoe.tar.gz && \
#     # Tippecanoe をビルドしてインストール (/usr/local/bin にインストールされる)
#     cd tippecanoe-${TIPPECANOE_VERSION} && \
#     make -j$(nproc) && \
#     make install && \
#     # クリーンアップ: ビルド後、不要になったツールやファイルを削除してイメージサイズを削減
#     cd .. && \
#     rm -rf tippecanoe-${TIPPECANOE_VERSION} tippecanoe.tar.gz && \
#     yum remove -y make gcc gcc-c++ zlib-devel sqlite-devel curl tar gzip && \
#     yum clean all && \
#     rm -rf /var/cache/yum

# # Lambda関数のコード (app.py など) と requirements.txt をコピー
# # Dockerfileと同じディレクトリに app.py と requirements.txt があると仮定
# COPY app.py requirements.txt ./

# # requirements.txt に記載されたPython依存関係をインストール
# # (boto3はLambda環境に含まれますが、他に必要なライブラリがあれば記載)
# RUN pip install --no-cache-dir -r requirements.txt

# # Lambda関数ハンドラーを指定 (例: app.py ファイルの lambda_handler 関数)
# # 実際のファイル名と関数名に合わせて変更してください
# CMD ["app.lambda_handler"]