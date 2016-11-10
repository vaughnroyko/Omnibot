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

    onInit (api: API) {
        this.bank = api.database.collection<Account>("points", {
            chatter: { type: String, unique: true },
            balance: { type: Number, default: 5 },
            stat_donated: { type: Number, default: 0 },
            stat_stolen: { type: Number, default: 0 },
            stat_awarded: { type: Number, default: 0 },
            stat_stolenFrom: { type: Number, default: 0 }
        });

        Timeline.repeat.forever(60, () => {
            if (api.isLive) {
                let chatters = api.chat.listChatters();
                let accounts: string[] = [];
                for (let chatter of chatters) accounts.push(chatter.name);
                this.bank.where({ chatter: { $in: accounts } }).update({ $inc: { balance: 1 } });
            }
        });
    }
    onChatterJoin (api: API, chatter: Chatter, isNew: boolean) {
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
            call: (api: API, caller: Chatter, requestedUser: string) => {
                let chatter: Chatter;
                if (requestedUser) {
                    chatter = api.chat.findChatter(requestedUser);
                    if (!chatter) return api.reply(caller, "Are you sure '" + requestedUser + "' has been here before?");
                } else chatter = caller;

                let account = this.bank.where({ chatter: chatter.name }).findOne();
                if (!account) account = this.openAccount(chatter);
                api.reply(caller, 
                    (requestedUser ? "The balance of " + requestedUser + " is " : "Your balance is ") + account.balance
                );
            }
        }
    }
}