/* ============================================================
   dashboard.js — powers index.html
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    const data = loadData();
    const balances = computeNetBalances(data.expenses);
    const youBalance = balances["You"] || 0;

    document.getElementById("total-expenses").textContent = formatRupees(getOverallTotal());
    document.getElementById("you-owe").textContent = formatRupees(youBalance < 0 ? -youBalance : 0);
    document.getElementById("you-are-owed").textContent = formatRupees(youBalance > 0 ? youBalance : 0);

    renderGroups(data);
    renderRecentExpenses(data);
});

function renderGroups(data) {
    const grid = document.getElementById("groups-grid");

    if (data.groups.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No groups yet</h3>
                <p>Create a group to start splitting expenses.</p>
                <a href="group.html" class="btn">Create a Group</a>
            </div>
        `;
        return;
    }

    grid.innerHTML = data.groups.map(group => `
        <div class="group-card">
            <h3>${group.name}</h3>
            <p>${group.members.length} members</p>
            <p class="group-money">${formatRupees(getGroupTotal(group.id))} spent</p>
        </div>
    `).join("");
}

function renderRecentExpenses(data) {
    const container = document.getElementById("recent-expenses");

    if (data.expenses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No expenses yet</h3>
                <p>Add your first expense to start tracking your spending.</p>
                <a href="add-expense.html" class="btn">Add Expense</a>
            </div>
        `;
        return;
    }

    const groupNameById = Object.fromEntries(data.groups.map(g => [g.id, g.name]));
    const recent = [...data.expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    container.innerHTML = `
        <div class="groups-grid">
            ${recent.map(expense => `
                <div class="group-card">
                    <h3>${expense.description}</h3>
                    <p>Paid by ${expense.paidBy} · ${groupNameById[expense.groupId] || "No group"}</p>
                    <p class="group-money">${formatRupees(expense.amount)}</p>
                </div>
            `).join("")}
        </div>
    `;
}
