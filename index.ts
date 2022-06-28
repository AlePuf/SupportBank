class Transaction {
    date: string;
    from: string;
    to: string;
    narrative: string;
    amount: number;

    constructor(date: string, from: string, to: string, amount: number, narrative: string) {
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

    addTransaction(date: string, from: string, to: string, amount: number, narrative: string) {
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

function addTransactionToAccounts(date: string, from: string, to: string, narrative: string, amount: number, accArr: Array<Account>) {
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

function parse_file(filename: string, accArr: Array<Account>) {
    const csv = require('csv-parser');
    const fs = require('fs');
    fs.createReadStream(filename)
        .pipe(csv())
        .on('data', (data: any) => {
            addTransactionToAccounts(data["Date"], data["From"], data["To"], data["Narrative"], parseInt(data["Amount"]), accArr);
        })
        .on('end', () => {
            main(accArr);
        });
}

function main(accArr: Array<Account>) {
    while (1) {
        let command: string = readlineSync.question("Enter a command (List All, List [Account], exit): ");
        if (command == "List All") {
            for (let i = 0; i < accArr.length; i++) {
                if (accArr[i].balance > 0) {
                    console.log(accArr[i].name + " is owed " + accArr[i].balance);
                } else if (accArr[i].balance < 0) {
                    console.log(accArr[i].name + " owes " + (-accArr[i].balance));
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
        } else if (command == "exit") {
            break;
        } else {
            console.log("Invalid command");
        }
    }
}

let readlineSync = require('readline-sync');
parse_file('Transactions2014.csv', []);
