/* ============================================================
   groups.js — powers group.html
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    renderGroupCards();

    document.getElementById("add-member-btn").addEventListener("click", addMemberInputRow);
    document.getElementById("create-group-form").addEventListener("submit", handleCreateGroup);
});

function renderGroupCards() {
    const grid = document.getElementById("groups-grid");
    const data = loadData();

    if (data.groups.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No groups yet</h3>
                <p>Create your first group below.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = data.groups.map(group => {
        const groupExpenses = data.expenses.filter(e => e.groupId === group.id);
        const settled = isGroupFullySettled(group.id, groupExpenses, data.settledPayments);

        const deleteButton = settled
            ? `<button class="btn-remove-group" data-group="${group.id}">Delete Group</button>`
            : `<button class="btn-remove-group" disabled title="Settle every payment on the Settlements page first">Delete Group</button>`;

        return `
            <div class="group-card">
                <h2>${group.name}</h2>
                <p>${group.members.length} members (${group.members.join(", ")})</p>
                <p class="group-money">${formatRupees(getGroupTotal(group.id))} total expenses</p>
                <a href="add-expense.html?group=${group.id}" class="btn">Add Expense</a>
                ${deleteButton}
                ${settled ? "" : '<p class="hint">🔒 Locked — outstanding payments in this group.</p>'}
            </div>
        `;
    }).join("");

    grid.querySelectorAll(".btn-remove-group:not([disabled])").forEach(button => {
        button.addEventListener("click", () => handleDeleteGroup(button.dataset.group));
    });
}

function handleDeleteGroup(groupId) {
    const data = loadData();
    const group = data.groups.find(g => g.id === groupId);
    if (!group) return;

    const confirmed = confirm(
        `Delete "${group.name}"? This removes the group and all its expenses. This can't be undone.`
    );
    if (!confirmed) return;

    deleteGroupAndExpenses(groupId);
    renderGroupCards();
}

function addMemberInputRow() {
    const container = document.getElementById("member-inputs");

    const row = document.createElement("div");
    row.className = "member-input-row";
    row.innerHTML = `
        <input type="text" class="member-name-input" placeholder="Member name">
        <button type="button" class="btn-remove" title="Remove">×</button>
    `;
    row.querySelector(".btn-remove").addEventListener("click", () => row.remove());

    container.appendChild(row);
}

function handleCreateGroup(event) {
    event.preventDefault();

    const name = document.getElementById("new-group-name").value.trim();
    const type = document.getElementById("new-group-type").value;
    const memberNames = Array.from(document.querySelectorAll(".member-name-input"))
        .map(input => input.value)
        .filter(name => name.trim().length > 0);

    if (!name) return;

    addGroup(name, type, memberNames);

    event.target.reset();
    document.getElementById("member-inputs").innerHTML =
        `<div class="member-input-row"><input type="text" class="member-name-input" placeholder="Member name"></div>`;

    renderGroupCards();
}
