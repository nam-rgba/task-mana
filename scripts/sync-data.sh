#!/bin/bash

# Script để sync data từ local lên server

# Màu sắc cho output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
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

# Hiển thị thống kê export
echo -e "${CYAN}📊 Thống kê dữ liệu export:${NC}"
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/tmp/db_export.json', 'utf8'));
const stats = data.metadata?.stats || {};
console.log('   - Users: ' + (stats.users || 0));
console.log('   - Plans: ' + (stats.plans || 0));
console.log('   - Teams: ' + (stats.teams || 0));
console.log('   - Team Members: ' + (stats.teamMembers || 0));
console.log('   - Projects: ' + (stats.projects || 0));
console.log('   - Tasks: ' + (stats.tasks || 0));
console.log('   - AI Feedbacks: ' + (stats.aiFeedbacks || 0));
console.log('   - Orders: ' + (stats.orders || 0));
console.log('   - Subscriptions: ' + (stats.subscriptions || 0));
console.log('   - Payment Histories: ' + (stats.paymentHistories || 0));
console.log('   - Tokens: ' + (stats.tokens || 0));
"
echo ""

# 2. Import data lên server
echo -e "${YELLOW}📥 Step 2: Import data lên server...${NC}"

# Extract phần data từ response using node (không cần jq)
IMPORT_PAYLOAD=$(node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/tmp/db_export.json', 'utf8'));
console.log(JSON.stringify({ data: data.metadata.data }));
")

IMPORT_RESULT=$(curl -s -X POST "${SERVER_URL}/api/database/import" \
    -H "Content-Type: application/json" \
    -d "$IMPORT_PAYLOAD")

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Lỗi khi import data lên server${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Đã import data lên server thành công${NC}"

# Hiển thị kết quả import
echo -e "${CYAN}📊 Kết quả import:${NC}"
echo "$IMPORT_RESULT" | node -e "
const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
    try {
        const result = JSON.parse(chunks.join(''));
        const imported = result.metadata?.imported || {};
        Object.entries(imported).forEach(([key, value]) => {
            console.log('   - ' + key + ': ' + value);
        });
    } catch(e) {
        console.log('   Raw response:', chunks.join(''));
    }
});
"

echo -e "\n${GREEN}🎉 Hoàn thành sync data!${NC}"
