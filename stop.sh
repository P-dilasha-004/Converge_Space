#!/bin/bash


echo "Stopping Converge Space Application..."
echo ""

# Kill backend processes
echo "Stopping backend server..."
pkill -f "nodemon.*server\|tsx.*server" 2>/dev/null
lsof -ti:5001 | xargs kill -9 2>/dev/null

# Kill frontend processes
echo "Stopping frontend server..."
pkill -f "vite\|react-router" 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null

echo ""
echo "All servers stopped!"
echo ""

