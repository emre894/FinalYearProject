"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserInfo {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Converts a MongoDB ObjectId string to a short 8-character account reference
// e.g. "6627a3f2e1b4c2d9f0a12345" becomes "#f0a12345"
const shortId = (id: string): string => `#${id.slice(-8)}`;

// Formats a date string into "15 January 2026"
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsClient() {
  // User info loaded on mount
  const [user, setUser] = useState<UserInfo | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Name form state
  const [newName, setNewName] = useState("");
  const [nameMessage, setNameMessage] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Danger zone state
  const [transactionCount, setTransactionCount] = useState<number | null>(null);
  const [deleteStep, setDeleteStep] = useState(0); // 0 = idle, 1 = confirm shown, 2 = deleting
  const [deleteMessage, setDeleteMessage] = useState("");

  // Load user info and transaction count on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/settings");
        const data = await res.json();
        if (data.ok) {
          setUser(data.user);
          setNewName(data.user.name);
        }
      } catch {
        // fail silently — page still usable
      } finally {
        setUserLoading(false);
      }
    };

    const fetchCount = async () => {
      try {
        const res = await fetch("/api/transactions?limit=500");
        const data = await res.json();
        if (data.ok) setTransactionCount(data.count);
      } catch {
        // fail silently
      }
    };

    fetchUser();
    fetchCount();
  }, []);

  // ── Handle name update ────────────────────────────────────────────────────────
  const handleNameSave = async () => {
    setNameMessage("");
    setNameError("");
    setNameSaving(true);

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "name", name: newName }),
      });
      const data = await res.json();

      if (data.ok) {
        setNameMessage("Name updated successfully.");
        setUser((prev) => (prev ? { ...prev, name: newName } : prev));
      } else {
        setNameError(data.message ?? "Could not update name.");
      }
    } catch {
      setNameError("Something went wrong.");
    } finally {
      setNameSaving(false);
    }
  };

  // ── Handle password change ────────────────────────────────────────────────────
  const handlePasswordSave = async () => {
    setPasswordMessage("");
    setPasswordError("");

    // Client-side check before sending to server
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "password", currentPassword, newPassword }),
      });
      const data = await res.json();

      if (data.ok) {
        setPasswordMessage("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(data.message ?? "Could not update password.");
      }
    } catch {
      setPasswordError("Something went wrong.");
    } finally {
      setPasswordSaving(false);
    }
  };

  // ── Handle delete all transactions ────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteStep(2);
    setDeleteMessage("");

    try {
      const res = await fetch("/api/transactions", { method: "DELETE" });
      const data = await res.json();

      if (data.ok) {
        setDeleteMessage(`Done. ${data.deletedCount} transactions deleted.`);
        setTransactionCount(0);
        setDeleteStep(0);
      } else {
        setDeleteMessage(data.message ?? "Could not delete transactions.");
        setDeleteStep(0);
      }
    } catch {
      setDeleteMessage("Something went wrong.");
      setDeleteStep(0);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-500 text-sm">
          Manage your account details and preferences.
        </p>
      </div>

      {/* ── Account Information ── */}
      <section className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-xl">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Account Information
        </h2>

        {userLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : user ? (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Display name</span>
              <span className="font-medium text-gray-800">
                {user.name || "Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-800">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account ID</span>
              <span className="font-mono text-gray-600">{shortId(user.id)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Member since</span>
              <span className="font-medium text-gray-800">
                {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Could not load account info.</p>
        )}
      </section>

      {/* ── Edit Display Name ── */}
      <section className="mb-8 p-6 bg-white border border-gray-200 rounded-xl">
        <h2 className="text-base font-semibold text-gray-800 mb-1">
          Display Name
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          This name is shown in your account information.
        </p>

        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3"
        />

        {nameMessage && (
          <p className="text-sm text-green-600 mb-2">{nameMessage}</p>
        )}
        {nameError && (
          <p className="text-sm text-red-600 mb-2">{nameError}</p>
        )}

        <button
          onClick={handleNameSave}
          disabled={nameSaving}
          className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {nameSaving ? "Saving..." : "Save Name"}
        </button>
      </section>

      {/* ── Change Password ── */}
      <section className="mb-8 p-6 bg-white border border-gray-200 rounded-xl">
        <h2 className="text-base font-semibold text-gray-800 mb-1">
          Change Password
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Enter your current password to confirm your identity before setting a
          new one.
        </p>

        <div className="space-y-3 mb-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {passwordMessage && (
          <p className="text-sm text-green-600 mb-2">{passwordMessage}</p>
        )}
        {passwordError && (
          <p className="text-sm text-red-600 mb-2">{passwordError}</p>
        )}

        <button
          onClick={handlePasswordSave}
          disabled={passwordSaving}
          className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {passwordSaving ? "Updating..." : "Update Password"}
        </button>
      </section>

      {/* ── Danger Zone ── */}
      <section className="p-6 bg-white border border-red-200 rounded-xl">
        <h2 className="text-base font-semibold text-red-700 mb-1">
          Danger Zone
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          This will permanently delete all your transaction data. Your account
          will remain active.
        </p>

        {/* Transaction count */}
        {transactionCount !== null && (
          <p className="text-sm text-gray-600 mb-4">
            You currently have{" "}
            <span className="font-semibold text-gray-800">
              {transactionCount}
            </span>{" "}
            stored transaction{transactionCount !== 1 ? "s" : ""}.
          </p>
        )}

        {/* Step 0 — initial button */}
        {deleteStep === 0 && (
          <button
            onClick={() => setDeleteStep(1)}
            disabled={transactionCount === 0}
            className="px-5 py-2.5 bg-white text-red-600 text-sm font-medium border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete All Transactions
          </button>
        )}

        {/* Step 1 — confirmation */}
        {deleteStep === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-red-600 font-medium">
              Are you sure? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, delete all transactions
              </button>
              <button
                onClick={() => setDeleteStep(0)}
                className="px-5 py-2.5 bg-white text-gray-600 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — deleting in progress */}
        {deleteStep === 2 && (
          <p className="text-sm text-gray-500">Deleting transactions...</p>
        )}

        {/* Result message */}
        {deleteMessage && (
          <p className="text-sm text-gray-600 mt-3">{deleteMessage}</p>
        )}
      </section>
    </div>
  );
}