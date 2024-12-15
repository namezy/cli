#! /usr/bin/env sh
# 告诉脚本有错误时就退出，不再继续执行
set -e
echo "请输入版本号："
read version
read -p "确认版本号为：$version? (y/n)" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    if [[ `git status --porcelain` ]]
    then
        git add .
        git commit -m "release: $version"
    else
        echo "没有文件需要提交"
    fi
    npm version $version
    git push origin master
    git push origin refs/tags/v$version
    npm publish
else
    echo "取消构建"
fi