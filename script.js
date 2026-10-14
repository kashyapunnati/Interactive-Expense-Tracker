const expenseForm = document.getElementById("expenseForm");
const expenseTitle = document.getElementById("expenseTitle");
const expenseAmount = document.getElementById("expenseAmount");
const expenseCategory = document.getElementById("expenseCategory");
const expenseDate = document.getElementById("expenseDate");
const expenseNotes = document.getElementById("expenseNotes");

const expenseList = document.getElementById("expenseList");
const emptyState = document.getElementById("emptyState");
const formMessage = document.getElementById("formMessage");

const totalAmount = document.getElementById("totalAmount");
const expenseCount = document.getElementById("expenseCount");
const highestExpense = document.getElementById("highestExpense");

const submitBtn = document.getElementById("submitBtn");
const formTitle = document.getElementById("formTitle");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const dateFilter = document.getElementById("dateFilter");
const sortFilter = document.getElementById("sortFilter");

const resultsCount = document.getElementById("resultsCount");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

const STORAGE_KEY = "interactiveExpenseTracker";

let expenses = loadExpenses();
let editingId = null;

function getLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

expenseDate.value = getLocalDate();

function loadExpenses() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return [];
        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(function (expense) {
            return (
                expense &&
                typeof expense.id === "string" &&
                typeof expense.title === "string" &&
                typeof expense.amount === "number" &&
                Number.isFinite(expense.amount) &&
                typeof expense.category === "string" &&
                typeof expense.date === "string"
            );
        });
    } catch (error) {
        console.error("Unable to load saved expenses:", error);
        return [];
    }
}

function saveExpenses() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
        return true;
    } catch (error) {
        console.error("Unable to save expenses:", error);
        showMessage(
            "Could not save data. Check your browser storage settings.",
            "error"
        );
        return false;
    }
}


function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString) {
    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    const date = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function showMessage(message, type = "success") {
    formMessage.textContent = message;
    formMessage.style.color =
        type === "error" ? "#dc2626" : "#15803d";
}

function clearMessage() {
    formMessage.textContent = "";
}

function getCategoryIcon(category) {
    const icons = {
        Food: "🍔",
        Transport: "🚗",
        Shopping: "🛍️",
        Bills: "💡",
        Education: "📚",
        Health: "🏥",
        Entertainment: "🎬",
        Other: "📦"
    };

    return icons[category] || "🧾";
}

expenseForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = expenseTitle.value.trim();
    const amount = Number(expenseAmount.value);
    const category = expenseCategory.value;
    const date = expenseDate.value;
    const notes = expenseNotes.value.trim();

    if (!title || !category || !date) {
        showMessage("Please complete all required fields.", "error");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        showMessage("Please enter an amount greater than zero.", "error");
        return;
    }

    if (amount > 1000000000000) {
        showMessage("Please enter a smaller amount.", "error");
        return;
    }

    if (editingId !== null) {
        const index = expenses.findIndex(function (expense) {
            return expense.id === editingId;
        });

        if (index === -1) {
            resetForm();
            showMessage("Expense not found. Please try again.", "error");
            return;
        }

        const updatedExpense = {
            ...expenses[index],
            title: title,
            amount: amount,
            category: category,
            date: date,
            notes: notes
        };

        expenses[index] = updatedExpense;

        if (!saveExpenses()) {
            return;
        }

        resetForm();
        renderExpenses();
        showMessage("Expense updated successfully!");
        return;
    }

    const newExpense = {
        id: createId(),
        title: title,
        amount: amount,
        category: category,
        date: date,
        notes: notes,
        createdAt: Date.now()
    };

    expenses.push(newExpense);

    if (!saveExpenses()) {
        expenses.pop();
        return;
    }

    resetForm();
    renderExpenses();
    showMessage("Expense added successfully!");
});

function createId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );
}

function resetForm() {
    expenseForm.reset();

    expenseDate.value = getLocalDate();

    editingId = null;
    formTitle.textContent = "Add New Expense";
    submitBtn.textContent = "+ Add Expense";
    cancelEditBtn.hidden = true;
}

function editExpense(id) {
    const expense = expenses.find(function (item) {
        return item.id === id;
    });

    if (!expense) {
        showMessage("Expense not found.", "error");
        return;
    }

    editingId = id;

    expenseTitle.value = expense.title;
    expenseAmount.value = expense.amount;
    expenseCategory.value = expense.category;
    expenseDate.value = expense.date;
    expenseNotes.value = expense.notes || "";

    formTitle.textContent = "Edit Expense";
    submitBtn.textContent = "Save Changes";
    cancelEditBtn.hidden = false;

    clearMessage();

    document.getElementById("expenseFormSection").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

cancelEditBtn.addEventListener("click", function () {
    resetForm();
    clearMessage();
});

function deleteExpense(id) {
    const expense = expenses.find(function (item) {
        return item.id === id;
    });

    if (!expense) {
        return;
    }

    const confirmed = window.confirm(
        `Delete "${expense.title}" from your expenses?`
    );

    if (!confirmed) {
        return;
    }

    const previousExpenses = expenses;

    expenses = expenses.filter(function (item) {
        return item.id !== id;
    });

    if (!saveExpenses()) {
        expenses = previousExpenses;
        return;
    }

    if (editingId === id) {
        resetForm();
    }

    renderExpenses();
    showMessage("Expense deleted successfully!");
}

function getFilteredExpenses() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedDate = dateFilter.value;

    let filtered = expenses.filter(function (expense) {
        const matchesSearch =
            expense.title.toLowerCase().includes(searchTerm) ||
            expense.category.toLowerCase().includes(searchTerm) ||
            (expense.notes || "").toLowerCase().includes(searchTerm);

        const matchesCategory =
            selectedCategory === "All" ||
            expense.category === selectedCategory;

        const matchesDate =
            selectedDate === "" ||
            expense.date === selectedDate;

        return matchesSearch && matchesCategory && matchesDate;
    });

    const sortType = sortFilter.value;

    filtered.sort(function (a, b) {
        switch (sortType) {
            case "oldest":
                return a.date.localeCompare(b.date) ||
                    (a.createdAt || 0) - (b.createdAt || 0);

            case "high":
                return b.amount - a.amount;

            case "low":
                return a.amount - b.amount;

            case "name":
                return a.title.localeCompare(b.title);

            case "newest":
            default:
                return b.date.localeCompare(a.date) ||
                    (b.createdAt || 0) - (a.createdAt || 0);
        }
    });

    return filtered;
}

searchInput.addEventListener("input", renderExpenses);
categoryFilter.addEventListener("change", renderExpenses);
dateFilter.addEventListener("change", renderExpenses);
sortFilter.addEventListener("change", renderExpenses);

clearFiltersBtn.addEventListener("click", function () {
    searchInput.value = "";
    categoryFilter.value = "All";
    dateFilter.value = "";
    sortFilter.value = "newest";

    renderExpenses();
});

function updateSummary() {
    const total = expenses.reduce(function (sum, expense) {
        return sum + expense.amount;
    }, 0);

    const highest = expenses.reduce(function (max, expense) {
        return Math.max(max, expense.amount);
    }, 0);

    totalAmount.textContent = formatCurrency(total);
    expenseCount.textContent = expenses.length;
    highestExpense.textContent = formatCurrency(highest);
}

function renderExpenses() {
    updateSummary();

    const filteredExpenses = getFilteredExpenses();

    expenseList.replaceChildren();

    resultsCount.textContent =
        `${filteredExpenses.length} ${
            filteredExpenses.length === 1 ? "expense" : "expenses"
        } found`;

    emptyState.hidden = filteredExpenses.length !== 0;
    expenseList.hidden = filteredExpenses.length === 0;

    filteredExpenses.forEach(function (expense) {
        const item = document.createElement("article");
        item.className = "expense-item";

        const main = document.createElement("div");
        main.className = "expense-main";

        const icon = document.createElement("div");
        icon.className = "expense-icon";
        icon.textContent = getCategoryIcon(expense.category);

        const details = document.createElement("div");
        details.className = "expense-details";

        const title = document.createElement("h3");
        title.textContent = expense.title;

        const date = document.createElement("p");
        date.textContent = formatDate(expense.date);

        const badge = document.createElement("span");
        badge.className = "category-badge";
        badge.textContent = expense.category;

        details.append(title, date, badge);

        if (expense.notes) {
            const notes = document.createElement("p");
            notes.className = "expense-notes";
            notes.textContent = expense.notes;
            details.appendChild(notes);
        }

        main.append(icon, details);

        const right = document.createElement("div");
        right.className = "expense-right";

        const amount = document.createElement("div");
        amount.className = "expense-amount";
        amount.textContent = formatCurrency(expense.amount);

        const actions = document.createElement("div");
        actions.className = "expense-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "action-btn edit-btn";
        editButton.textContent = "Edit";
        editButton.setAttribute(
            "aria-label",
            `Edit ${expense.title}`
        );

        editButton.addEventListener("click", function () {
            editExpense(expense.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "action-btn delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute(
            "aria-label",
            `Delete ${expense.title}`
        );

        deleteButton.addEventListener("click", function () {
            deleteExpense(expense.id);
        });

        actions.append(editButton, deleteButton);
        right.append(amount, actions);

        item.append(main, right);
        expenseList.appendChild(item);
    });
}

renderExpenses();