# ベースイメージとして Node.js 20 の Alpine 版を使用
FROM node:20-alpine AS development

# アプリケーションの作業ディレクトリを設定
WORKDIR /app

# ホストマシンのポートの代わりにコンテナ内のポート変更を Vite に伝える (任意、Vite HMR WebSocket用)
ENV HMR_PORT=5173

# package.json と package-lock.json (あれば) をコピー
# package-lock.json がない場合は、npm install により生成されます
COPY package.json ./
COPY package-lock.json ./

# 依存関係をインストール
# CI環境でクリーンインストールしたい場合は npm ci を使用
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# Vite 開発サーバーが使用するポートを公開
EXPOSE 5173

# コンテナ起動時に実行するコマンド (Vite 開発サーバーを起動)
CMD ["npm", "run", "dev", "--", "--host"]