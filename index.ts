class Transaction {
    date: Date;
    from: string;
    to: string;
    narrative: string;
    amount: number;

    constructor(date: Date, from: string, to: string, amount: number, narrative: string) {
        this.date = date;
        this.to = to;
        this.from = from;
        this.amount = amount;
        this.narrative = narrative;
    }
}

class Account {
    name: string;
    transactions: Array<Transaction> = [];
    balance: number = 0;

    constructor(name: string) {
        this.name = name;
    }

    addTransaction(date: Date, from: string, to: string, amount: number, narrative: string) {
        this.transactions.push(new Transaction(date, from, to, amount, narrative));
        if (this.name == from) {
            this.balance -= amount;
        } else {
            this.balance += amount;
        }
    }

    printTransactions() {
        for (let i = 0; i < this.transactions.length; i++) {
            let currTransaction = this.transactions[i];
            console.log("Date: " + currTransaction.date + ", From: " + currTransaction.from + ", To: " + currTransaction.to + ", Narrative: " + currTransaction.narrative + ", Amount: " + currTransaction.amount);
        }
    }
}

function addTransactionToAccounts(date: Date, from: string, to: string, narrative: string, amount: number, accArr: Array<Account>) {
    if (isNaN(amount)) {
        logger.log("error", "Amount invalid, ignoring transaction");
        return;
    }
    let foundFrom = 0, foundTo = 0;
    for (let i = 0; i < accArr.length; i++) {
        if (accArr[i].name == from) {
            foundFrom = 1;
            accArr[i].addTransaction(date, from, to, amount, narrative);
        } else if (accArr[i].name == to) {
            foundTo = 1;
            accArr[i].addTransaction(date, from, to, amount, narrative);
        }
    }
    if (foundFrom == 0) {
        accArr.push(new Account(from));
        accArr[accArr.length - 1].addTransaction(date, from, to, amount, narrative);
    }
    if (foundTo == 0) {
        accArr.push(new Account(to));
        accArr[accArr.length - 1].addTransaction(date, from, to, amount, narrative);
    }
}

function parse_csv_file(filename: string, accArr: Array<Account>) {
    const fs = require('fs');
    let lines = fs.readFileSync(filename).toString().split("\n");
    const res = lines.map((line: string) => line.split(","));
    logger.log("info", "Opened file " + filename);
    for (let i = 1; i < res.length; i++) {
        if (res[i].length < 5) {
            logger.log("warn", "Reached end of file");
            continue;
        }
        let parsedDate = moment(res[i][0], "DD/MM/YYYY");
        if (!parsedDate.isValid()) {
            logger.log("error", "Invalid date at line " + (i - 1).toString() + ", ignoring transaction");
            continue;
        }
        addTransactionToAccounts(parsedDate.toDate(), res[i][1], res[i][2], res[i][3], parseFloat(res[i][4]), accArr);
        logger.log("info", "Added transaction");
    }
}

function parse_json_file(filename: string, accArr: Array<Account>) {
    const fs = require('fs');
    let transactions = JSON.parse(fs.readFileSync(filename).toString());
    logger.log("info", "Opened file " + filename);
    for (let i = 0; i < transactions.length; i++) {
        let transaction = transactions[i];
        let parsedDate = moment(transaction["Date"]);
        if (!parsedDate.isValid()) {
            logger.log("error", "Invalid date at line " + i.toString() + ", ignoring transaction");
            continue;
        }
        addTransactionToAccounts(parsedDate.toDate(), transaction["FromAccount"], transaction["ToAccount"], transaction["Narrative"], parseFloat(transaction["Amount"]), accArr);
        logger.log("info", "Added transaction");
    }
    logger.log("warn", "Reached end of file");
}

function parse_xml_file(filename: string, accArr: Array<Account>) {
    const fs = require('fs');
    let transactions = parser.parse(fs.readFileSync(filename).toString());
    logger.log("info", "Opened file " + filename);
    let transactionList = transactions["TransactionList"]["SupportTransaction"];
    for (let i = 0; i < transactionList.length; i++) {
        let transaction = transactionList[i];
        let parsedDate = new Date((parseInt(transaction["@_Date"]) - 25568) * 86400000);
        if (isNaN(Date.parse(parsedDate.toString()))) {
            logger.log("error", "Invalid date at line " + i.toString() + ", ignoring transaction");
            continue;
        }
        addTransactionToAccounts(parsedDate, transaction["Parties"]["From"], transaction["Parties"]["To"], transaction["Description"], parseFloat(transaction["Value"]), accArr);
        logger.log("info", "Added transaction");
    }
    logger.log("warn", "Reached end of file");
}

function main(accArr: Array<Account>) {
    parse_csv_file('Transactions2014.csv', accArr);
    parse_json_file('Transactions2013.json', accArr);
    parse_xml_file('Transactions2012.xml', accArr);
    while (1) {
        let command: string = readlineSync.question("Enter a command (List All, List [account], Import File [filename], exit): ");
        if (command == "List All") {
            for (let i = 0; i < accArr.length; i++) {
                if (accArr[i].balance > 0) {
                    console.log(accArr[i].name + " is owed " + accArr[i].balance.toFixed(2));
                } else if (accArr[i].balance < 0) {
                    console.log(accArr[i].name + " owes " + (-accArr[i].balance).toFixed(2));
                } else {
                    console.log(accArr[i].name + " is settled up!");
                }
            }
        } else if (command.indexOf("List") != -1) {
            let name = command.substring(5);
            let found = 0;
            for (let i = 0; i < accArr.length; i++) {
                if (accArr[i].name == name) {
                    accArr[i].printTransactions();
                    found = 1;
                    break;
                }
            }
            if (!found) {
                console.log("Account does not exist!");
            }
        } else if (command.indexOf("Import File") != -1) {
            let name = command.substring(12);
            let filenameSplit = name.split('.');
            if (filenameSplit[filenameSplit.length - 1].toLowerCase() == "csv") {
                parse_csv_file(name, accArr);
                console.log("File imported successfully");
            } else if (filenameSplit[filenameSplit.length - 1].toLowerCase() == "json") {
                parse_json_file(name, accArr);
                console.log("File imported successfully");
            } else {
                console.log("Unsupported file extension");
            }
        } else if (command == "exit") {
            break;
        } else {
            console.log("Invalid command");
        }
    }
}

const log4js = require('log4js');
log4js.configure({
    appenders: {
        file: { type: 'fileSync', filename: 'logs/debug.log' }
    },
    categories: {
        default: { appenders: ['file'], level: 'debug'}
    }
});
const logger = log4js.getLogger('log');
const moment = require('moment');
const {XMLParser} = require('fast-xml-parser');
const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
});
let readlineSync = require('readline-sync');
main([]);
