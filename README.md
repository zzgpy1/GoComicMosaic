# GoComicMosaic
golang重构版  

重构的时候前端也顺便进行了一些优化改造，增加分页，搜索改回调用后端api  

linux机器直接编译二进制
```
go build -ldflags="-w -s" -o app
```

mac上交叉编译linux二进制
```
sudo chown -R $(whoami):admin /usr/local/Homebrew
chmod u+w /usr/local/Homebrew

brew install x86_64-linux-gnu-binutils
brew tap messense/macos-cross-toolchains
brew install x86_64-unknown-linux-gnu

CC=/usr/local/Cellar/x86_64-unknown-linux-gnu/13.3.0.reinstall/bin/x86_64-linux-gnu-gcc CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -tags "sqlite_static" -ldflags="-w -s" -o app cmd/api/main.go
```

运行
```
chmod +x
./app
```