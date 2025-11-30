"use client";

import { useEffect, useState } from "react";
import { readContract } from "@wagmi/core";
import { useAccount } from "wagmi";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

type Proposal = {
  id: number;
  description: string;
  yesVotes: number;
  noVotes: number;
  active: boolean;
};

export default function VotingPage() {
  const { address } = useAccount();

  const { data: votingContract } = useDeployedContractInfo({
    contractName: "VotingSystem",
  });

  const { data: proposalsCount } = useScaffoldReadContract({
    contractName: "VotingSystem",
    functionName: "getProposalsCount",
  });

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "VotingSystem",
  });

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [newDescription, setNewDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Загрузка списка предложений
  useEffect(() => {
    const loadProposals = async () => {
      if (!votingContract?.address || !votingContract?.abi || proposalsCount === undefined) return;

      const count = Number(proposalsCount);
      const items: Proposal[] = [];

      for (let i = 0; i < count; i++) {
        const result = await readContract(wagmiConfig, {
          address: votingContract.address,
          abi: votingContract.abi,
          functionName: "getProposal",
          args: [BigInt(i)],
        });

        const [description, yesVotes, noVotes, active] = result as [string, bigint, bigint, boolean];
        items.push({
          id: i,
          description,
          yesVotes: Number(yesVotes),
          noVotes: Number(noVotes),
          active,
        });
      }

      setProposals(items);
    };

    loadProposals().catch(console.error);
  }, [votingContract?.address, votingContract?.abi, proposalsCount]);

  const handleCreateProposal = async () => {
    if (!newDescription.trim()) return;
    try {
      setLoading(true);
      await writeContractAsync({
        functionName: "createProposal",
        args: [newDescription.trim()],
      });
      setNewDescription("");
    } catch (e: any) {
      console.error(e);
      alert(e?.shortMessage ?? e?.message ?? "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id: number, support: boolean) => {
    try {
      setLoading(true);
      await writeContractAsync({
        functionName: "vote",
        args: [BigInt(id), support],
      });
    } catch (e: any) {
      console.error(e);
      alert(e?.shortMessage ?? e?.message ?? "Vote failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (id: number) => {
    try {
      setLoading(true);
      await writeContractAsync({
        functionName: "finishProposal",
        args: [BigInt(id)],
      });
    } catch (e: any) {
      console.error(e);
      alert(e?.shortMessage ?? e?.message ?? "Finish failed (only owner can finish)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <section className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-slate-900">Голосование</h1>
          <p className="text-xs text-slate-500">
            Подключённый адрес:{" "}
            <span className="font-mono break-all">{address ?? "кошелёк не подключён"}</span>
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Создать предложение</h2>
          <p className="mt-1 text-xs text-slate-500">
            Введите формулировку вопроса или описания, по которому будут голосовать пользователи.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Например: «Выбрать тему проекта X»"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
            />
            <button
              onClick={handleCreateProposal}
              disabled={loading || !newDescription.trim()}
              className="inline-flex items-center justify-center rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Создать
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Список предложений</h2>

          {proposals.length === 0 && (
            <p className="text-sm text-slate-500">Пока нет ни одного предложения. Создайте первое выше.</p>
          )}

          {proposals.map(p => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-wide text-slate-400">
                  ID #{p.id}
                </span>
                <span className="text-[11px] rounded-full border px-2 py-0.5 text-slate-500 bg-slate-50">
                  {p.active ? "активно" : "завершено"}
                </span>
              </div>
              <div className="text-sm font-medium text-slate-900">{p.description}</div>
              <div className="text-xs text-slate-600">
                Да: <span className="font-mono">{p.yesVotes}</span> · Нет:{" "}
                <span className="font-mono">{p.noVotes}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => handleVote(p.id, true)}
                  disabled={loading || !p.active}
                  className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Голосовать ЗА
                </button>
                <button
                  onClick={() => handleVote(p.id, false)}
                  disabled={loading || !p.active}
                  className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Голосовать ПРОТИВ
                </button>
                <button
                  onClick={() => handleFinish(p.id)}
                  disabled={loading || !p.active}
                  className="ml-auto rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Завершить (owner)
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
