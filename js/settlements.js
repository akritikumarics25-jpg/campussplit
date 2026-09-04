/* ============================================================
   settlements.js — powers settlement.html
   
   ============================================================ */

document.addEventListener("DOMContentLoaded", renderAllGroupSettlements);

function renderAllGroupSettlements() {
    const data = loadData();
    const container = document.getElementById("group-settlements");

    if (data.groups.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No groups yet</h3>
                <p>Create a group and add some expenses to see settlements here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = data.groups.map(group => renderGroupBlock(group, data)).join("");

    data.groups.forEach(group => {
        container.querySelectorAll(`.mark-paid-btn[data-group="${group.id}"]`).forEach(button => {
            button.addEventListener("click", () => markAsPaid(group.id, button.dataset.key, button));
        });

        const toggleBtn = container.querySelector(`.toggle-detailed-btn[data-group="${group.id}"]`);
        if (toggleBtn) toggleBtn.addEventListener("click", () => toggleDetailedBreakdown(group.id));
    });
}

function renderGroupBlock(group, data) {
    const groupExpenses = data.expenses.filter(e => e.groupId === group.id);

    if (groupExpenses.length === 0) {
        return `
            <section class="settlement-card">
                <h2>${group.name}</h2>
                <p>No expenses in this group yet.</p>
            </section>
        `;
    }

    const balances = computeNetBalances(groupExpenses);
    const payments = computeSettlement(balances);
    const pairwisePayments = computePairwiseSettlement(groupExpenses);
    const settled = data.settledPayments || {};

    const balanceRows = Object.entries(balances)
        .filter(([, amount]) => Math.abs(amount) > 0.01)
        .map(([member, amount]) => {
            const isOwed = amount > 0;
            return `
                <div class="settlement-item">
                    <div><strong>${member}</strong><p>${isOwed ? "is owed" : "owes"}</p></div>
                    <span class="${isOwed ? "owed" : "owe"}">${formatRupees(Math.abs(amount))}</span>
                </div>
            `;
        }).join("") || "<p>Everyone is settled up. 🎉</p>";

    const smartRows = payments.length === 0
        ? "<p>No payments needed.</p>"
        : payments.map(p => {
            const key = paymentKey(group.id, p.from, p.to);
            const isPaid = !!settled[key];
            return `
                <div class="settlement-item">
                    <div><strong>${p.from}</strong><p>→ pays ${p.to}</p></div>
                    <span class="owe">${formatRupees(p.amount)}</span>
                    <button class="btn mark-paid-btn" data-group="${group.id}" data-key="${key}" ${isPaid ? "disabled" : ""}>
                        ${isPaid ? "✅ Paid" : "Mark as Paid"}
                    </button>
                </div>
            `;
        }).join("") + `<p>${payments.length} payment${payments.length === 1 ? "" : "s"} needed</p>`;

    const detailedRows = pairwisePayments.length === 0
        ? "<p>Nothing to break down.</p>"
        : pairwisePayments.map(p => `
            <div class="settlement-item">
                <div><strong>${p.from}</strong><p>→ pays ${p.to}</p></div>
                <span class="owe">${formatRupees(p.amount)}</span>
            </div>
        `).join("");

    return `
        <section class="settlement-card">
            <h2>${group.name}</h2>

            <h3>Current Balances</h3>
            ${balanceRows}

            <h3>💸 Smart Settlement</h3>
            ${smartRows}

            <div class="section-header">
                <h3>🔍 Detailed Breakdown</h3>
                <button type="button" class="secondary-btn toggle-detailed-btn" data-group="${group.id}">Show</button>
            </div>
            <p class="hint">Who owes whom, traced back to each expense in this group.</p>
            <div class="detailed-breakdown" id="detailed-${group.id}" style="display:none;">
                ${detailedRows}
            </div>
        </section>
    `;
}

function markAsPaid(groupId, key, button) {
    const data = loadData();
    data.settledPayments = data.settledPayments || {};
    data.settledPayments[key] = true;
    saveData(data);

    button.textContent = "✅ Paid";
    button.disabled = true;
}

function toggleDetailedBreakdown(groupId) {
    const container = document.getElementById(`detailed-${groupId}`);
    const button = document.querySelector(`.toggle-detailed-btn[data-group="${groupId}"]`);
    const isHidden = container.style.display === "none";

    container.style.display = isHidden ? "block" : "none";
    button.textContent = isHidden ? "Hide" : "Show";
}
