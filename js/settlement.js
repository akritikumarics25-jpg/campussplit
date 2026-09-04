/* ============================================================
   settlement.js
  
   ============================================================ */

function computeNetBalances(expenses) {
    const balances = {};
    const credit = (member, amount) => {
        balances[member] = (balances[member] || 0) + amount;
    };

    expenses.forEach(expense => {
        credit(expense.paidBy, expense.amount);

        if (expense.splitType === "unequal" && expense.shares) {
            Object.entries(expense.shares).forEach(([member, share]) => {
                credit(member, -share);
            });
        } else {
            const share = expense.amount / expense.splitBetween.length;
            expense.splitBetween.forEach(member => credit(member, -share));
        }
    });

    Object.keys(balances).forEach(member => {
        balances[member] = Math.round(balances[member] * 100) / 100;
    });

    return balances;
}

/**
 * Greedy min-cash-flow settlement — matches the biggest creditor
 * with the biggest debtor repeatedly, minimizing total payments.
 */
function computeSettlement(balances) {
    const creditors = [];
    const debtors = [];

    Object.entries(balances).forEach(([member, amount]) => {
        if (amount > 0.01) creditors.push({ member, amount });
        else if (amount < -0.01) debtors.push({ member, amount: -amount });
    });

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const payments = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const settledAmount = Math.min(debtor.amount, creditor.amount);

        if (settledAmount > 0.01) {
            payments.push({
                from: debtor.member,
                to: creditor.member,
                amount: Math.round(settledAmount * 100) / 100
            });
        }

        debtor.amount -= settledAmount;
        creditor.amount -= settledAmount;

        if (debtor.amount <= 0.01) i++;
        if (creditor.amount <= 0.01) j++;
    }

    return payments;
}

function paymentKey(groupId, from, to) {
    return `${groupId}:${from}|${to}`;
}

/**
 * A group is safe to delete once every Smart Settlement payment it
 * needs has actually been marked Paid (or it never needed any).
 * This does NOT just check that balances sum to zero — marking a
 * payment "Paid" is the real signal that money changed hands.
 */
function isGroupFullySettled(groupId, groupExpenses, settledPayments) {
    const balances = computeNetBalances(groupExpenses);
    const payments = computeSettlement(balances);
    if (payments.length === 0) return true;

    return payments.every(p =>
        !!(settledPayments || {})[paymentKey(groupId, p.from, p.to)]
    );
}

/**
 * "Detailed Breakdown" — who owes whom, netted only within each PAIR
 * (not across the whole group). This traces directly back to the
 * expenses themselves, so e.g. if Rahul paid for dinner and Isha
 * paid for the movie, this shows the one payment between just the
 * two of them after cancelling out their mutual debt — more
 * payments overall than Smart Settlement, but each one maps
 * intuitively to "who paid what."
 */
function computePairwiseSettlement(expenses) {
    const debtMatrix = {}; // debtMatrix[debtor][creditor] = amount owed

    const addDebt = (debtor, creditor, amount) => {
        if (debtor === creditor) return;
        debtMatrix[debtor] = debtMatrix[debtor] || {};
        debtMatrix[debtor][creditor] = (debtMatrix[debtor][creditor] || 0) + amount;
    };

    expenses.forEach(expense => {
        if (expense.splitType === "unequal" && expense.shares) {
            Object.entries(expense.shares).forEach(([member, share]) => {
                addDebt(member, expense.paidBy, share);
            });
        } else {
            const share = expense.amount / expense.splitBetween.length;
            expense.splitBetween.forEach(member => addDebt(member, expense.paidBy, share));
        }
    });

    const seenPairs = new Set();
    const result = [];

    Object.keys(debtMatrix).forEach(debtor => {
        Object.keys(debtMatrix[debtor]).forEach(creditor => {
            const pairKey = [debtor, creditor].sort().join("|");
            if (seenPairs.has(pairKey)) return;
            seenPairs.add(pairKey);

            const forward = debtMatrix[debtor]?.[creditor] || 0;
            const backward = debtMatrix[creditor]?.[debtor] || 0;
            const net = Math.round((forward - backward) * 100) / 100;

            if (net > 0.01) {
                result.push({ from: debtor, to: creditor, amount: net });
            } else if (net < -0.01) {
                result.push({ from: creditor, to: debtor, amount: -net });
            }
        });
    });

    return result;
}
