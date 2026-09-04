/* ============================================================
   expense.js — powers add-expense.html
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    const data = loadData();
    const groupSelect = document.getElementById("group");

    populateGroupDropdown(data);

    groupSelect.addEventListener("change", () => populateMembers(data, groupSelect.value));

    document.querySelectorAll('input[name="splitType"]').forEach(radio =>
        radio.addEventListener("change", renderUnequalInputsIfNeeded)
    );
    document.getElementById("amount").addEventListener("input", validateUnequalTotal);
    document.getElementById("smart-input-btn").addEventListener("click", () => handleSmartInput(data));
    document.getElementById("expense-form").addEventListener("submit", event => handleSubmit(event, data));

    // Preselect a group if we arrived via a group's "Add Expense" button
    const preselectedGroup = new URLSearchParams(window.location.search).get("group");
    if (preselectedGroup) {
        groupSelect.value = preselectedGroup;
        populateMembers(data, preselectedGroup);
    }
});

function populateGroupDropdown(data) {
    const groupSelect = document.getElementById("group");
    data.groups.forEach(group => {
        groupSelect.appendChild(new Option(group.name, group.id));
    });
}

/** Rebuilds "Paid By" and "Split Between" for however many members the chosen group actually has. */
function populateMembers(data, groupId) {
    const group = data.groups.find(g => g.id === groupId);
    const paidBySelect = document.getElementById("paidBy");
    const checkboxGroup = document.getElementById("split-between-group");

    if (!group) {
        paidBySelect.innerHTML = '<option value="">Select a group first</option>';
        checkboxGroup.innerHTML = '<p class="hint">Select a group first</p>';
        return;
    }

    paidBySelect.innerHTML = '<option value="">Select person</option>';
    checkboxGroup.innerHTML = "";

    group.members.forEach(member => {
        paidBySelect.appendChild(new Option(member, member));

        const label = document.createElement("label");
        label.innerHTML = `<input type="checkbox" value="${member}" checked> ${member}`;
        checkboxGroup.appendChild(label);
    });

    renderUnequalInputsIfNeeded();
}

function renderUnequalInputsIfNeeded() {
    const splitType = document.querySelector('input[name="splitType"]:checked')?.value;
    const container = document.getElementById("unequal-inputs");
    container.innerHTML = "";
    if (splitType !== "unequal") return;

    const checkedMembers = Array.from(
        document.querySelectorAll("#split-between-group input[type=checkbox]:checked")
    ).map(cb => cb.value);

    checkedMembers.forEach(member => {
        const row = document.createElement("div");
        row.className = "unequal-row";
        row.innerHTML = `
            <label for="share-${member}">${member}</label>
            <input type="number" id="share-${member}" data-member="${member}" placeholder="₹0">
        `;
        container.appendChild(row);
    });

    container.querySelectorAll("input[type=number]").forEach(input =>
        input.addEventListener("input", validateUnequalTotal)
    );
}

function validateUnequalTotal() {
    const splitType = document.querySelector('input[name="splitType"]:checked')?.value;
    const warning = document.getElementById("split-warning");

    if (splitType !== "unequal") {
        warning.style.display = "none";
        return;
    }

    const required = parseFloat(document.getElementById("amount").value) || 0;
    const shareInputs = document.querySelectorAll("#unequal-inputs input[type=number]");
    const entered = Array.from(shareInputs).reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);

    if (shareInputs.length > 0 && Math.round(entered * 100) !== Math.round(required * 100)) {
        warning.textContent = `⚠️ Amount doesn't match — Entered: ${formatRupees(entered)}, Required: ${formatRupees(required)}`;
        warning.style.display = "block";
    } else {
        warning.style.display = "none";
    }
}

async function handleSmartInput(data) {
    const text = document.getElementById("smart-input").value.trim();
    const status = document.getElementById("smart-input-status");
    const groupSelect = document.getElementById("group");
    if (!text) return;

    const selectedGroup = data.groups.find(g => g.id === groupSelect.value);
    const members = selectedGroup ? selectedGroup.members : [...new Set(data.groups.flatMap(g => g.members))];

    status.textContent = "Thinking…";

    try {
        const parsed = await parseExpenseWithGemini(text, members);

        document.getElementById("description").value = parsed.description || "";
        document.getElementById("amount").value = parsed.amount || "";

        if (!selectedGroup) {
            const guessedGroup = data.groups.find(g => g.members.includes(parsed.paidBy));
            if (guessedGroup) {
                groupSelect.value = guessedGroup.id;
                populateMembers(data, guessedGroup.id);
            }
        }

        if (parsed.paidBy) document.getElementById("paidBy").value = parsed.paidBy;

        document.querySelectorAll("#split-between-group input[type=checkbox]").forEach(cb => {
            cb.checked = (parsed.splitBetween || []).includes(cb.value);
        });

        status.textContent = "Filled in — check the fields below before saving.";
    } catch (err) {
        console.error(err);
        status.textContent = "Couldn't parse that — try filling the form manually.";
    }
}

function handleSubmit(event, data) {
    event.preventDefault();

    const description = document.getElementById("description").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const groupId = document.getElementById("group").value;
    const paidBy = document.getElementById("paidBy").value;
    const splitBetween = Array.from(
        document.querySelectorAll("#split-between-group input[type=checkbox]:checked")
    ).map(cb => cb.value);
    const splitType = document.querySelector('input[name="splitType"]:checked')?.value || "equal";

    if (!description || !amount || !groupId || !paidBy || splitBetween.length === 0) {
        alert("Please fill in every field before adding the expense.");
        return;
    }

    let shares = null;
    if (splitType === "unequal") {
        shares = {};
        document.querySelectorAll("#unequal-inputs input[type=number]").forEach(input => {
            shares[input.dataset.member] = parseFloat(input.value) || 0;
        });
        const total = Object.values(shares).reduce((a, b) => a + b, 0);
        if (Math.round(total * 100) !== Math.round(amount * 100)) {
            alert("The unequal split amounts don't add up to the total. Please fix them first.");
            return;
        }
    }

    addExpense({ description, amount, category, groupId, paidBy, splitBetween, splitType, shares });

    alert(`${description} (${formatRupees(amount)}) added!`);
    window.location.href = "settlement.html";
}
