# About

Time Control is a software designed for parents who want to manage their children's computer usage time.
It is composed of a client that runs on your computer and a server that runs on your child's computer.

# Prerequisites

Currently, the server can only run on **Windows** but you can still use the client on other platforms.

# Installation

### In your computer

- Download and extract the [client](https://github.com/kelio-mv/time-control/releases/download/v1.0/client.zip) web application.

### In your child's computer

1. Download the [server](https://github.com/kelio-mv/time-control/releases/download/v1.0/server.exe) executable.
2. Move it to **C:\Windows\System32**.
3. Create a basic task in **Task Scheduler** to start the program when the user logs in.
4. Open the task properties and check "Run with highest privileges". Move to the tab "Conditions" and uncheck "Start the task only if the computer is on AC power. Move to the tab "Settings" and uncheck "Stop the task if it runs longer than 3 days". Finally click "OK".
5. Log out and then log in to start the service.

# Usage

In order to configure your child's computer usage time, your computer must be connected to the same network of your child's computer. This is only necessary in the first setup or when you need to make changes.

1. In your computer, open the file **start.exe** from the extracted folder. If you aren't on **Windows**, start an **HTTP server** and open the URL in your browser.
2. Type the **IP Address** of your child's computer on your **local network** and connect.

Now, let me clarify some things that might not be clear.

### Downtime and Daily limit

You must use the 24-hour format for both, as in the following examples:

- If you want a downtime between **10 pm** and **8 am**, use **22:00 - 08:00**.
- If you want a daily limit of **2 hours** and **30 minutes**, use **02:30**.

### Other

- **Wireless Network Name**: This allows the server to automatically connect to your Wi-Fi in order to sync the system time.
- **Update Interval**: The interval of execution of the main loop in milliseconds.
- **Lock Interval**: The interval of execution of the lock function in milliseconds.

### Automatic system time sync

This will avoid unwanted behavior when your child's computer time is wrong and will prevent them to change the time in order to keep using the computer.

# Build

If you want to build this software from your own computer, download this repository as zip, extract it, and follow these steps:

## Client

1. In the extracted folder, open the terminal and run the commands

```console
npm install
npm run build
cd client
pyinstaller start_http-server.py --onefile --name=Time_Control --icon=../public/app-logo.ico
```

2. Create a new folder wherever you want (e.g. in your desktop)
3. Move the executable from the folder **client/dist** and the content of the folder **dist** to the folder you created

## Server

- In the extracted folder, open the terminal and run the commands

```console
cd server
npm install
npm run build
```
