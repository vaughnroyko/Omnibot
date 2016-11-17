import {
    Plugin, API, Ranks,
    CommandLibrary, Command,
    Chatter,
    Collection, Document
} from "../../api";

import { Timeline } from "consolemate";

export class Account extends Document {
    public name: string;
    public balance: number;
    public stat_donated: number;
    public stat_stolen: number;
    public stat_awarded: number;
    public stat_stolenFrom: number;

    static getRep (account: Account) {
        let reputation = account.stat_donated - account.stat_stolen;
        return account.balance * reputation / 1000;
    }

}

export class Points extends Plugin {
    bank: Collection<Account>;

    onInit () {
        this.bank = this.api.database.collection<Account>("points", {
            chatter: { type: String, unique: true },
            balance: { type: Number, default: 5 },
            stat_donated: { type: Number, default: 0 },
            stat_stolen: { type: Number, default: 0 },
            stat_awarded: { type: Number, default: 0 },
            stat_stolenFrom: { type: Number, default: 0 }
        });

        Timeline.repeat.forever(60, () => {
            if (this.api.channel.live) {
                let chatters = this.api.chat.listChatters();
                let accounts: string[] = [];
                for (let chatter of chatters) accounts.push(chatter.name);
                this.bank.where({ chatter: { $in: accounts } }).update({ $inc: { balance: 1 } });
            }
        });
    }
    onChatterJoin (chatter: Chatter, isNew: boolean) {
        if (isNew) this.openAccount(chatter);
    }

    openAccount (chatter: Chatter) {
        return this.bank.insert({
            chatter: chatter.name
        });
    }

    commands: CommandLibrary = {
        balance: {
            args: [
                {
                    name: "user",
                    type: "string?"
                }
            ],
            call: (caller: Chatter, requestedUser: string) => {
                let chatter: Chatter;
                if (requestedUser) {
                    chatter = this.api.chat.findChatter(requestedUser);
                    if (!chatter) return this.api.reply(caller, "Are you sure '" + requestedUser + "' has been here before?");
                } else chatter = caller;

                let account = this.bank.where({ chatter: chatter.name }).findOne();
                if (!account) account = this.openAccount(chatter);
                this.api.reply(caller, 
                    (requestedUser ? "The balance of " + requestedUser + " is " : "Your balance is ") + account.balance
                );
            }
        },
        
        donate: {
            args: [
                {
                    name: "user",
                    type: "string"
                },
                {
                    name: "amount",
                    type: "string"
                }
            ],
            call: (caller: Chatter, requestedUser: string, preAmount: string) => {
                let chatter = this.api.chat.findChatter(requestedUser);
                if (!chatter) return this.api.reply(caller, "Are you sure '" + requestedUser + "' has been here before?");

                let toAccount = this.bank.where({ chatter: chatter.name }).findOne();
                if (!toAccount) toAccount = this.openAccount(chatter);
                let fromAccount = this.bank.where({ chatter: caller.name }).findOne();
                if (!fromAccount) fromAccount = this.openAccount(caller);

                let amount = preAmount == "*" ? fromAccount.balance : parseInt(preAmount);
                if (isNaN(amount)) return;
                if (amount < 0) return this.api.reply(caller, "are you trying to steal? =(");

                if (fromAccount.balance < amount) return this.api.reply(caller, "not enough");
                toAccount.balance += amount; toAccount.save();
                fromAccount.balance -= amount; fromAccount.save();
                this.api.reply(caller, "success");
            }
        },
        
        award: {
            args: [
                {
                    name: "user",
                    type: "string"
                },
                {
                    name: "amount",
                    type: "string"
                }
            ],
            rank: { min: Ranks.mod },
            call: (caller: Chatter, requestedUser: string, preAmount: string) => {
                let amount = parseInt(preAmount);
                if (isNaN(amount)) return;
                if (amount < 0) return this.api.reply(caller, "you can't award a negative amount of points");

                if (requestedUser == "*") {
                    let chatters = this.api.chat.listChatters();
                    for (let chatter of chatters) {
                        let account = this.bank.where({ chatter: chatter.name }).findOne();
                        if (!account) account = this.openAccount(chatter);

                        account.balance += amount; account.save();
                    }
                } else {
                    let chatter = this.api.chat.findChatter(requestedUser);
                    if (!chatter) return this.api.reply(caller, "Are you sure '" + requestedUser + "' has been here before?");

                    let account = this.bank.where({ chatter: chatter.name }).findOne();
                    if (!account) account = this.openAccount(chatter);

                    account.balance += amount; account.save();
                }

                this.api.reply(caller, "success");
            }
        },
        
        tax: {
            args: [
                {
                    name: "user",
                    type: "string"
                },
                {
                    name: "amount",
                    type: "string"
                }
            ],
            rank: { min: Ranks.mod },
            call: (caller: Chatter, requestedUser: string, preAmount: string) => {
                let amount = -1;
                if (preAmount != "*") {
                    amount = parseInt(preAmount);
                    if (isNaN(amount)) return;
                    if (amount < 0) return this.api.reply(caller, "you can't tax a negative amount of points");
                }

                if (requestedUser == "*") {
                    let chatters = this.api.chat.listChatters();
                    for (let chatter of chatters) {
                        let account = this.bank.where({ chatter: chatter.name }).findOne();
                        if (!account) account = this.openAccount(chatter);

                        if (amount == -1) account.balance = 0;
                        else account.balance -= amount;
                        if (account.balance < 0) account.balance = 0;
                        account.save();
                    }
                } else {
                    let chatter = this.api.chat.findChatter(requestedUser);
                    if (!chatter) return this.api.reply(caller, "Are you sure '" + requestedUser + "' has been here before?");

                    let account = this.bank.where({ chatter: chatter.name }).findOne();
                    if (!account) account = this.openAccount(chatter);

                    if (amount == -1) account.balance = 0;
                    else account.balance -= amount;
                    if (account.balance < 0) account.balance = 0;
                    account.save();
                }

                this.api.reply(caller, "success");
            }
        }
    }
}