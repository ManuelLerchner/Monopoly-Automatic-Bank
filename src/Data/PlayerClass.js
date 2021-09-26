import BankIMG from "../images/Bank.png";
import HistoryIMG from "../images/history.png";

import moment from "moment";

const { v4: uuidv4 } = require("uuid");
const DATE_RFC2822 = "ddd, DD MMM YYYY HH:mm:ss ZZ";

export class PlayerClass {
    constructor(name, startMoney) {
        this.id = uuidv4();
        this.name = name;

        this.balance = Number.parseFloat(startMoney) || 10 * 10 ** 6;
        this.properties = [];
        this.houses = 0;
        this.skyscraper = 0;
        this.estimatedValue = 0;
        this.hasMonopolyTower = false;

        this.hasSkyScraperOn = {};

        this.history = [];

        this.history.push({
            msg: `${this.name} Received Start Money`,
            time: moment(new Date()).format(DATE_RFC2822),
            amount: this.balance,
            total: this.balance,
            netWorth: this.calcEstimatedValue(),
            direction: "+",
        });

        this.changes = {
            balance: "",
            properties: "",
            houses: "",
            skyscraper: "",
        };

        this.img = `https://avatars.dicebear.com/api/open-peeps/${name+Date()}.svg`;

        if (this.name === "Bank") {
            this.img = BankIMG;
        }
        if (this.name === "Total History") {
            this.img = HistoryIMG;
        }

        this.calcEstimatedValue = this.calcEstimatedValue.bind(this);
        this.calcEstimatedValue();
    }

    static formatMoney(balance) {
        const sign = balance < 0 ? "-" : "";
        let postFix = "";
        let balanceAbs = Math.abs(balance);

        if (balanceAbs >= 10 ** 9) {
            postFix = "G";
            balanceAbs /= 10 ** 9;
        } else if (balanceAbs >= 10 ** 6) {
            postFix = "M";
            balanceAbs /= 10 ** 6;
        } else if (balanceAbs >= 10 ** 3) {
            postFix = "K";
            balanceAbs /= 10 ** 3;
        } else {
            postFix = "$";
        }

        return (
            sign +
            String(Math.round(balanceAbs * 100) / 100).replace(".", ",") +
            "\u00A0" +
            postFix
        );
    }

    static parseMoney(money) {
        const lastLetter = money.charAt(money.length - 1);
        const hasPostfix = ["k", "M", "G"].includes(lastLetter);
        const postFix = lastLetter;

        let amountPart = hasPostfix
            ? money.substring(0, money.length - 1)
            : money;

        amountPart = amountPart.replace(",", ".");

        const number = parseFloat(amountPart);

        if (isNaN(number)) {
            return NaN;
        }

        let balance = number;
        if (postFix === "M" || !hasPostfix) {
            balance *= 10 ** 6;
        } else if (postFix === "k") {
            balance *= 10 ** 3;
        } else if (postFix === "G") {
            balance *= 10 ** 9;
        }

        return balance;
    }

    static sendMoney(sender, receiver, amount) {
        const balanceMoved =
            typeof amount === "string"
                ? PlayerClass.parseMoney(amount)
                : amount;

        if (isNaN(balanceMoved)) {
            return [false, "Invalid Money Format"];
        }

        if (sender.id === receiver.id) {
            return [false, "Sender is Receiver"];
        }

        if (sender.balance < balanceMoved) {
            return [false, "Not enought Money"];
        }

        sender.balance -= balanceMoved;
        receiver.balance += balanceMoved;

        sender.calcEstimatedValue();
        receiver.calcEstimatedValue();

        sender.changes["balance"] = "-";
        receiver.changes["balance"] = "+";

        sender.history.push({
            msg: `${sender.name} paid Money to ${receiver.name}`,
            time: moment(new Date()).format(DATE_RFC2822),
            amount: balanceMoved,
            total: sender.balance,
            netWorth: sender.calcEstimatedValue(),
            direction: "-",
        });

        receiver.history.push({
            msg: `${receiver.name} received Money from ${sender.name}`,
            time: moment(new Date()).format(DATE_RFC2822),
            amount: balanceMoved,
            total: receiver.balance,
            netWorth: receiver.calcEstimatedValue(),
            direction: "+",
        });

        return [true, "Successfull"];
    }

    static buyProperty(buyer, property) {
        const cost = property.cost;

        if (buyer.balance < cost) {
            return [false, "Not enought Money"];
        }

        buyer.balance -= cost;
        buyer.properties.push(property);

        buyer.calcEstimatedValue();

        if (cost > 0) {
            buyer.changes["balance"] = "-";
        }

        buyer.changes["properties"] = "+";

        buyer.history.push({
            msg: `${buyer.name} bought ${property.name}`,
            time: moment(new Date()).format(DATE_RFC2822),
            amount: cost,
            total: buyer.balance,
            netWorth: buyer.calcEstimatedValue(),
            direction: "-",
        });

        property.owner = buyer;

        return [true, "Successfull"];
    }

    static builtBuilding(buyer, property, building, price) {
        if (buyer.balance < price) {
            return [false, "Not enought Money"];
        }

        if (["house", "industrial"].includes(building.type)) {
            buyer.houses += building.slotsTaken;
            buyer.changes["houses"] = "+";
        } else if (building.type === "skyscraper") {
            buyer.skyscraper += 1;
            buyer.changes["skyscraper"] = "+";
            buyer.hasSkyScraperOn[property.color] = true;
        } else if (building.type === "monopolyTower") {
            buyer.hasMonopolyTower = true;
        } else if (building.type === "negative") {
            property.negativeBuildings += building.negativeSpace;
        } else {
            console.log("Error", building.type);
            return [false, "Error while building"];
        }

        buyer.balance -= price;
        if (price > 0) {
            buyer.changes["balance"] = "-";
        }

        if (building.type === "negative") {
            buyer.history.push({
                msg: `${buyer.name} constructed ${building.name} on ${property.name}`,
                time: moment(new Date()).format(DATE_RFC2822),
                amount: price,
                total: buyer.balance,
                netWorth: buyer.calcEstimatedValue(),
                direction: "/",
            });
        } else {
            buyer.history.push({
                msg: `${buyer.name} bought ${building.name} on ${property.name}`,
                time: moment(new Date()).format(DATE_RFC2822),
                amount: price,
                total: buyer.balance,
                netWorth: buyer.calcEstimatedValue(),
                direction: "+",
            });
        }

        buyer.calcEstimatedValue();

        return [true, "Successfull"];
    }

    calcEstimatedValue() {
        let estimated = this.balance;

        this.properties.forEach((property) => {
            estimated += property.cost + property.buildingsWorth;
        });

        this.estimatedValue = estimated;
        return estimated;
    }
}
