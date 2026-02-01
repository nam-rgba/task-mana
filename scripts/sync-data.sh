#!/bin/bash

# Script để sync data từ local lên server

# Màu sắc cho output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL của local và server
LOCAL_URL="http://localhost:3000"
SERVER_URL="https://taskee.codes" # Thay bằng URL server thật (ví dụ: https://api.yourdomain.com)

echo -e "${YELLOW}🔄 Bắt đầu sync data từ local lên server...${NC}\n"

# 1. Export data từ local
echo -e "${YELLOW}📤 Step 1: Export data từ local...${NC}"
EXPORT_DATA=$(curl -s -X GET "${LOCAL_URL}/api/database/export")

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Lỗi khi export data từ local${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Đã export data từ local thành công${NC}"

# Lưu data vào file tạm
echo "$EXPORT_DATA" > /tmp/db_export.json
echo -e "${GREEN}   Đã lưu vào /tmp/db_export.json${NC}\n"

# 2. Import data lên server
echo -e "${YELLOW}📥 Step 2: Import data lên server...${NC}"

# Extract phần data từ response (bỏ qua metadata wrapper)
IMPORT_PAYLOAD=$(echo "$EXPORT_DATA" | jq -c '.metadata.data' 2>/dev/null || echo "$EXPORT_DATA")

IMPORT_RESULT=$(curl -s -X POST "${SERVER_URL}/api/database/import" \
    -H "Content-Type: application/json" \
    -d "{\"data\": $IMPORT_PAYLOAD}")

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Lỗi khi import data lên server${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Đã import data lên server thành công${NC}"
echo -e "${GREEN}$IMPORT_RESULT${NC}\n"

echo -e "${GREEN}🎉 Hoàn thành sync data!${NC}"

# In ra stats
echo -e "\n${YELLOW}📊 Thống kê:${NC}"
echo "$EXPORT_DATA" | jq '.data.stats' 2>/dev/null || echo "Cần cài đặt jq để xem thống kê chi tiết"
