#!/bin/bash


echo "Starting Converge Space Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is already running
if lsof -ti:5001 > /dev/null 2>&1; then
    echo -e "${YELLOW}  Backend is already running on port 5001${NC}"
else
    echo -e "${BLUE} Starting Backend Server...${NC}"
    cd backend
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    cd ..
    sleep 3
fi

# Check if frontend is already running
if lsof -ti:5173 > /dev/null 2>&1 || lsof -ti:5174 > /dev/null 2>&1; then
    echo -e "${YELLOW}  Frontend is already running${NC}"
else
    echo -e "${BLUE} Starting Frontend Server...${NC}"
    cd frontend/vite-project
    npm run dev > ../../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    cd ../..
    sleep 3
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  APPLICATION STARTED SUCCESSFULLY!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE} Frontend:${NC} http://localhost:5173 (or 5174)"
echo -e "${BLUE} Backend:${NC}  http://localhost:5001"
echo ""
echo -e "${YELLOW} To stop servers, run: ./stop.sh${NC}"
echo -e "${YELLOW} Or press Ctrl+C and run: pkill -f 'nodemon|vite'${NC}"
echo ""

