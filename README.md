# image-hub

[![](https://img.shields.io/docker/cloud/automated/playdingnow/imagehub?style=flat-square)](https://hub.docker.com/r/playdingnow/imagehub)
[![](https://img.shields.io/docker/cloud/build/playdingnow/imagehub?style=flat-square)](https://hub.docker.com/r/playdingnow/imagehub)

Image processing API service based on Sharp and nsfwjs

基于 Sharp 和 nsfwjs 的图像处理API。

# Demo

online demo deploy at Google Cloud Run, swagger url: https://imagehub-fe4uf6dinq-uc.a.run.app/swagger

在线 demo 运行在谷歌云的 Run 服务上，文档地址：https://imagehub-fe4uf6dinq-uc.a.run.app/swagger

# Docker

Your can run this project in locally using docker

你可以使用 docker 在本地运行本项目

```sh
docker run -p 3000:3000 --name imagehub playdingnow/imagehub:v1.2.1
```

then open `127.0.0.1:3000/swagger` to view the API documents

然后打开 `127.0.0.1:3000/swagger` 查看 API 文档