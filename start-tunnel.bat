@echo off
chcp 65001 > nul
title Self Upgrade - Cloudflare Tunnel

echo =======================================================
echo     SELF UPGRADE - KẾT NỐI INTERNET TOÀN CẦU (4G)
echo =======================================================
echo.
echo Bạn muốn mở Tunnel cho mục nào?
echo.
echo [1] Web + Backend (Cổng 5173 - Dùng ngay trên iPhone Safari/PWA qua 4G)
echo [2] Backend API trực tiếp (Cổng 2004 - Dành cho Mobile App gọi API riêng)
echo.
set /p choice="Nhập lựa chọn (1 hoặc 2, mặc định là 1): "

if "%choice%"=="2" (
    echo.
    echo 🚀 Đang kết nối Cloudflare Tunnel cho Backend API (Port 2004)...
    echo 👉 Tìm dòng link có đuôi .trycloudflare.com bên dưới để nhập vào App!
    echo.
    "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:2004
) else (
    echo.
    echo 🚀 Đang kết nối Cloudflare Tunnel cho Web (Port 5173)...
    echo 👉 Tìm dòng link có đuôi .trycloudflare.com bên dưới và mở trên iPhone Safari!
    echo.
    "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:5173
)

pause
