"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Pair = {
  id: string;
  left: string;
  right: string;
};

type Card = {
  id: string;
  pairId: string;
  content: string;
};

type Screen = "setup" | "dice" | "game" | "result";

const ROUND_SIZE = 5;
const STORAGE_KEY = "ghep-cap-pair-bank-v2";
const LEGACY_STORAGE_KEY = "ghep-cap-pair-bank-v1";
const TITLE_STORAGE_KEY = "ghep-cap-game-title-v1";
const DEFAULT_GAME_TITLE = "GHÉP CẶP";

const DEFAULT_PAIRS: Pair[] = [
  // Số thập phân và phân số thập phân tương ứng: 5 cặp dương, 5 cặp âm.
  { id: "thap-01", left: "0,7", right: "7/10" },
  { id: "thap-02", left: "1,3", right: "13/10" },
  { id: "thap-03", left: "2,6", right: "26/10" },
  { id: "thap-04", left: "4,2", right: "42/10" },
  { id: "thap-05", left: "8,9", right: "89/10" },
  { id: "thap-06", left: "−0,4", right: "−4/10" },
  { id: "thap-07", left: "−1,8", right: "−18/10" },
  { id: "thap-08", left: "−3,5", right: "−35/10" },
  { id: "thap-09", left: "−5,7", right: "−57/10" },
  { id: "thap-10", left: "−9,1", right: "−91/10" },
  // Hỗn số và phân số tương ứng: 5 cặp dương, 5 cặp âm.
  { id: "hon-01", left: "1 1/2", right: "3/2" },
  { id: "hon-02", left: "2 2/3", right: "8/3" },
  { id: "hon-03", left: "3 1/4", right: "13/4" },
  { id: "hon-04", left: "4 3/5", right: "23/5" },
  { id: "hon-05", left: "5 5/6", right: "35/6" },
  { id: "hon-06", left: "−1 2/5", right: "−7/5" },
  { id: "hon-07", left: "−2 3/4", right: "−11/4" },
  { id: "hon-08", left: "−3 4/7", right: "−25/7" },
  { id: "hon-09", left: "−4 1/3", right: "−13/3" },
  { id: "hon-10", left: "−5 7/8", right: "−47/8" },
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function makeId() {
  return `cap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function randomDieValue() {
  return Math.floor(Math.random() * 6) + 1;
}

function Die({ value }: { value: number | null }) {
  const dots: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  return (
    <div className={`die ${value ? "die--rolled" : ""}`} aria-label={value ? `Xúc xắc có ${value} chấm` : "Xúc xắc chưa tung"}>
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} className={value && dots[value].includes(index) ? "dot dot--show" : "dot"} />
      ))}
      {!value && <span className="die-question">?</span>}
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [gameTitle, setGameTitle] = useState(DEFAULT_GAME_TITLE);
  const [teams, setTeams] = useState<[string, string]>(["Đội 1", "Đội 2"]);
  const [draftTeams, setDraftTeams] = useState<[string, string]>(["Đội 1", "Đội 2"]);
  const [pairBank, setPairBank] = useState<Pair[]>(DEFAULT_PAIRS);
  const [bankOpen, setBankOpen] = useState(false);
  const [newPair, setNewPair] = useState({ left: "", right: "" });
  const [bulkText, setBulkText] = useState("");
  const [bankMessage, setBankMessage] = useState("");
  const [rolls, setRolls] = useState<[number | null, number | null]>([null, null]);
  const [currentTeam, setCurrentTeam] = useState(0);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [status, setStatus] = useState("Chọn hai thẻ để tạo thành một cặp.");
  const [activePairs, setActivePairs] = useState<Pair[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const displayTitle = gameTitle.trim() || DEFAULT_GAME_TITLE;

  useEffect(() => {
    const loadSavedBank = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Pair[];
          if (Array.isArray(parsed) && parsed.length) setPairBank(parsed);
        } else {
          const legacySaved = window.localStorage.getItem(LEGACY_STORAGE_KEY);
          if (legacySaved) {
            const legacyPairs = JSON.parse(legacySaved) as Pair[];
            const isUntouchedLegacySample = Array.isArray(legacyPairs)
              && legacyPairs.length === 8
              && legacyPairs.every((pair) => pair.id?.startsWith("mau-") && pair.left?.startsWith("Nội dung thẻ A"));
            if (Array.isArray(legacyPairs) && legacyPairs.length && !isUntouchedLegacySample) {
              setPairBank(legacyPairs);
            }
          }
        }
        const savedTitle = window.localStorage.getItem(TITLE_STORAGE_KEY);
        if (savedTitle?.trim()) setGameTitle(savedTitle);
      } catch {
        // Keep the built-in bank and title if saved data is invalid.
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(loadSavedBank);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pairBank));
  }, [pairBank, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(TITLE_STORAGE_KEY, displayTitle);
    document.title = displayTitle;
  }, [displayTitle, hydrated]);

  const validPairCount = useMemo(
    () => pairBank.filter((pair) => pair.left.trim() && pair.right.trim()).length,
    [pairBank],
  );

  const diceResolved = rolls[0] !== null && rolls[1] !== null;
  const diceTie = diceResolved && rolls[0] === rolls[1];
  const canStart = validPairCount >= ROUND_SIZE;

  function openDiceScreen() {
    const cleaned: [string, string] = [draftTeams[0].trim() || "Đội 1", draftTeams[1].trim() || "Đội 2"];
    setTeams(cleaned);
    setDraftTeams(cleaned);
    setRolls([null, null]);
    setScreen("dice");
  }

  function rollDie(teamIndex: number) {
    if (rolls[teamIndex] !== null) return;
    const value = randomDieValue();
    const next: [number | null, number | null] = [...rolls] as [number | null, number | null];
    next[teamIndex] = value;
    setRolls(next);
    if (next[0] !== null && next[1] !== null && next[0] !== next[1]) {
      setCurrentTeam(next[0] > next[1] ? 0 : 1);
    }
  }

  function reroll() {
    setRolls([null, null]);
  }

  function startRound() {
    const validPairs = pairBank.filter((pair) => pair.left.trim() && pair.right.trim());
    if (validPairs.length < ROUND_SIZE) {
      setBankMessage("Cần ít nhất 5 cặp có đủ nội dung trước khi bắt đầu.");
      setBankOpen(true);
      return;
    }

    const selected = shuffle(validPairs).slice(0, ROUND_SIZE);
    const deck = shuffle(
      selected.flatMap((pair) => [
        { id: `${pair.id}-a`, pairId: pair.id, content: pair.left },
        { id: `${pair.id}-b`, pairId: pair.id, content: pair.right },
      ]),
    );

    setActivePairs(selected);
    setCards(deck);
    setScores([0, 0]);
    setFlipped([]);
    setMatched([]);
    setLocked(false);
    setStatus("Chọn hai thẻ để tạo thành một cặp.");
    setScreen("game");
  }

  function chooseCard(card: Card) {
    if (locked || flipped.includes(card.id) || matched.includes(card.id)) return;
    const nextFlipped = [...flipped, card.id];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 1) {
      setStatus("Chọn thêm một thẻ.");
      return;
    }

    setLocked(true);
    const first = cards.find((item) => item.id === nextFlipped[0]);
    if (!first) return;

    if (first.pairId === card.pairId) {
      const nextMatched = [...matched, first.id, card.id];
      const nextScores: [number, number] = [...scores] as [number, number];
      nextScores[currentTeam] += 1;
      setMatched(nextMatched);
      setScores(nextScores);
      setFlipped([]);
      setLocked(false);
      setStatus(`Chính xác! ${teams[currentTeam]} được 1 điểm và tiếp tục chơi.`);
      if (nextMatched.length === activePairs.length * 2) {
        window.setTimeout(() => setScreen("result"), 850);
      }
      return;
    }

    setStatus("Chưa đúng. Ghi nhớ vị trí hai thẻ!");
    window.setTimeout(() => {
      setFlipped([]);
      setCurrentTeam((team) => (team === 0 ? 1 : 0));
      setLocked(false);
      setStatus("Đã chuyển lượt. Chọn hai thẻ để tạo thành một cặp.");
    }, 1300);
  }

  function playAgain() {
    setRolls([null, null]);
    setScreen("dice");
  }

  function newMatch() {
    setRolls([null, null]);
    setScreen("setup");
  }

  function addPair() {
    const left = newPair.left.trim();
    const right = newPair.right.trim();
    if (!left || !right) {
      setBankMessage("Vui lòng nhập đủ nội dung của hai thẻ.");
      return;
    }
    setPairBank((bank) => [...bank, { id: makeId(), left, right }]);
    setNewPair({ left: "", right: "" });
    setBankMessage("Đã thêm một cặp mới vào ngân hàng.");
  }

  function addBulkPairs() {
    const added = bulkText
      .split("\n")
      .map((line) => line.split("|").map((part) => part.trim()))
      .filter((parts) => parts.length >= 2 && parts[0] && parts[1])
      .map(([left, ...rightParts]) => ({ id: makeId(), left, right: rightParts.join(" | ") }));

    if (!added.length) {
      setBankMessage("Chưa tìm thấy dòng hợp lệ. Hãy dùng định dạng: Thẻ A | Thẻ B");
      return;
    }
    setPairBank((bank) => [...bank, ...added]);
    setBulkText("");
    setBankMessage(`Đã thêm ${added.length} cặp mới.`);
  }

  function updatePair(id: string, field: "left" | "right", value: string) {
    setPairBank((bank) => bank.map((pair) => (pair.id === id ? { ...pair, [field]: value } : pair)));
  }

  function removePair(id: string) {
    setPairBank((bank) => bank.filter((pair) => pair.id !== id));
    setBankMessage("Đã xóa cặp thẻ.");
  }

  function exportBank() {
    const blob = new Blob([JSON.stringify(pairBank, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ngan-hang-the-ghep-cap.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importBank(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Pair[];
        const cleaned = parsed
          .filter((pair) => pair && typeof pair.left === "string" && typeof pair.right === "string")
          .map((pair) => ({ id: pair.id || makeId(), left: pair.left, right: pair.right }));
        if (!cleaned.length) throw new Error("empty");
        setPairBank(cleaned);
        setBankMessage(`Đã nhập ${cleaned.length} cặp từ tệp.`);
      } catch {
        setBankMessage("Tệp không đúng định dạng ngân hàng thẻ.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function restoreSamples() {
    if (!window.confirm("Khôi phục ngân hàng mẫu? Nội dung hiện tại sẽ bị thay thế.")) return;
    setPairBank(DEFAULT_PAIRS);
    setBankMessage("Đã khôi phục ngân hàng mẫu.");
  }

  const winnerText = scores[0] === scores[1]
    ? "Hai đội hòa nhau!"
    : `${teams[scores[0] > scores[1] ? 0 : 1]} chiến thắng!`;

  return (
    <main className="app-shell">
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <div className="math-atmosphere" aria-hidden="true">
        <span className="math-glyph math-glyph--one">f(x)</span>
        <span className="math-glyph math-glyph--two">a² + b²</span>
        <span className="math-glyph math-glyph--three">πr²</span>
        <span className="math-glyph math-glyph--four">∑</span>
        <span className="math-glyph math-glyph--five">√x</span>
      </div>

      {screen === "setup" && (
        <section className="screen setup-screen">
          <header className="hero">
            <span className="eyebrow"><span className="eyebrow-dot" /> Math Match · Phòng học tương tác</span>
            <h1>{displayTitle}</h1>
            <p>Quan sát dữ kiện, ghi nhớ vị trí và kết nối chính xác các cặp kiến thức toán học.</p>
            <div className="hero-kicker" aria-label="Ba năng lực được rèn luyện">
              <span><b>01</b> Ghi nhớ</span>
              <span><b>02</b> Suy luận</span>
              <span><b>03</b> Kết nối</span>
            </div>
          </header>

          <div className="title-editor">
            <label>
              <span>Tên trò chơi</span>
              <input
                value={gameTitle}
                maxLength={60}
                onChange={(event) => setGameTitle(event.target.value)}
                placeholder={DEFAULT_GAME_TITLE}
                aria-describedby="title-help"
              />
            </label>
            <button type="button" onClick={() => setGameTitle(DEFAULT_GAME_TITLE)}>Đặt lại</button>
            <small id="title-help">Tên được lưu riêng trên trình duyệt của người đang sử dụng.</small>
          </div>

          <div className="setup-grid">
            <div className="glass-card team-form">
              <div className="section-heading">
                <span className="step-number">01</span>
                <div>
                  <h2>Thiết lập nhóm nghiên cứu</h2>
                  <p>Tên hai đội sẽ xuất hiện trên bảng điểm.</p>
                </div>
              </div>
              <label>
                Tên đội 1
                <input value={draftTeams[0]} maxLength={24} onChange={(event) => setDraftTeams([event.target.value, draftTeams[1]])} />
              </label>
              <label>
                Tên đội 2
                <input value={draftTeams[1]} maxLength={24} onChange={(event) => setDraftTeams([draftTeams[0], event.target.value])} />
              </label>
              <button className="primary-button" onClick={openDiceScreen} disabled={!canStart}>
                Bắt đầu trận đấu <span aria-hidden="true">→</span>
              </button>
              {!canStart && <p className="warning-text">Cần ít nhất 5 cặp đầy đủ nội dung để chơi.</p>}
            </div>

            <div className="glass-card bank-summary">
              <div className="section-heading">
                <span className="step-number step-number--amber">02</span>
                <div>
                  <h2>Thư viện cặp kiến thức</h2>
                  <p>Thêm và chỉnh sửa dữ kiện trước khi chơi.</p>
                </div>
              </div>
              <div className="bank-count">
                <strong>{validPairCount}</strong>
                <span>cặp đã sẵn sàng</span>
              </div>
              <div className="round-note">
                <span className="round-note-icon" aria-hidden="true">✦</span>
                <p>Mỗi trận lấy ngẫu nhiên <strong>5 cặp</strong> và xáo trộn thành 10 thẻ.</p>
              </div>
              <button className="secondary-button" onClick={() => { setBankMessage(""); setBankOpen(true); }}>
                <span aria-hidden="true">＋</span> Mở thư viện kiến thức
              </button>
            </div>
          </div>
          <footer className="open-source-note">
            <span><b>Mã nguồn mở</b> theo giấy phép MIT</span>
            <span className="open-source-links">
              <a href="https://github.com/pnnguyen1996/game-tuong-tac" target="_blank" rel="noreferrer">Xem mã nguồn</a>
              <a href="https://github.com/pnnguyen1996/game-tuong-tac/blob/main/LICENSE" target="_blank" rel="noreferrer">Xem giấy phép</a>
            </span>
          </footer>
        </section>
      )}

      {screen === "dice" && (
        <section className="screen dice-screen">
          <button className="back-button" onClick={() => setScreen("setup")}><span aria-hidden="true">←</span> Quay lại</button>
          <header className="compact-hero">
            <span className="eyebrow"><span className="eyebrow-dot" /> Phòng thí nghiệm xác suất</span>
            <h1>TUNG XÚC XẮC</h1>
            <p>Mỗi đội tung một lần. Đội có số lớn hơn được chơi trước.</p>
          </header>
          <div className="dice-arena">
            {[0, 1].map((teamIndex) => (
              <article className="dice-team glass-card" key={teamIndex}>
                <span className={`team-chip team-chip--${teamIndex + 1}`}>ĐỘI {teamIndex + 1}</span>
                <h2>{teams[teamIndex]}</h2>
                <Die value={rolls[teamIndex]} />
                <button className="primary-button" disabled={rolls[teamIndex] !== null} onClick={() => rollDie(teamIndex)}>
                  {rolls[teamIndex] ? `Đã tung: ${rolls[teamIndex]}` : "Tung xúc xắc"}
                </button>
              </article>
            ))}
            <div className="versus-badge">VS</div>
          </div>
          <div className="dice-result" aria-live="polite">
            {!diceResolved && "Mỗi đội hãy tung xúc xắc một lần."}
            {diceTie && <><strong>Hai đội hòa!</strong><button className="small-button" onClick={reroll}>Tung lại</button></>}
            {diceResolved && !diceTie && <><strong>{teams[currentTeam]} được chơi trước!</strong><button className="primary-button primary-button--inline" onClick={startRound}>Chia 10 thẻ</button></>}
          </div>
        </section>
      )}

      {screen === "game" && (
        <section className="screen game-screen">
          <header className="game-header">
            <div>
              <span className="eyebrow"><span className="eyebrow-dot" /> Trận đấu đang diễn ra</span>
              <h1>{displayTitle}</h1>
            </div>
            <button className="ghost-button" onClick={newMatch}>Kết thúc trận</button>
          </header>

          <div className="scoreboard">
            {[0, 1].map((teamIndex) => (
              <div className={`score-team score-team--${teamIndex + 1} ${currentTeam === teamIndex ? "score-team--active" : ""}`} key={teamIndex}>
                <span>{teams[teamIndex]}</span>
                <strong>{scores[teamIndex]}</strong>
              </div>
            ))}
            <div className="turn-pill"><span className="turn-dot" /> Lượt của: <strong>{teams[currentTeam]}</strong></div>
          </div>

          <div className="board" aria-label="Bàn chơi ghép cặp">
            {cards.map((card, index) => {
              const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
              const isMatched = matched.includes(card.id);
              return (
                <button
                  className={`memory-card ${isFlipped ? "memory-card--flipped" : ""} ${isMatched ? "memory-card--matched" : ""}`}
                  key={card.id}
                  onClick={() => chooseCard(card)}
                  disabled={isMatched || locked}
                  aria-label={isFlipped ? `Thẻ ${index + 1}: ${card.content}` : `Thẻ ${index + 1} đang úp`}
                >
                  <span className="memory-card-inner">
                    <span className="memory-card-front"><span>THẺ</span><b>{index + 1}</b></span>
                    <span className="memory-card-back">{card.content}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="status-bar" aria-live="polite"><span className="status-icon">i</span>{status}</div>
        </section>
      )}

      {screen === "result" && (
        <section className="screen result-screen">
          <div className="result-card glass-card">
            <div className="trophy" aria-hidden="true">★</div>
            <span className="eyebrow"><span className="eyebrow-dot" /> Kết quả trận đấu</span>
            <h1>{winnerText}</h1>
            <div className="final-score">
              <div><span>{teams[0]}</span><strong>{scores[0]}</strong></div>
              <b>—</b>
              <div><span>{teams[1]}</span><strong>{scores[1]}</strong></div>
            </div>
            <p>Đã tìm đủ {activePairs.length} cặp thẻ.</p>
            <div className="result-actions">
              <button className="primary-button" onClick={playAgain}>Chơi lại với hai đội này</button>
              <button className="secondary-button" onClick={newMatch}>Trận mới</button>
            </div>
          </div>
        </section>
      )}

      {bankOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="bank-modal" role="dialog" aria-modal="true" aria-labelledby="bank-title">
            <header className="bank-modal-header">
              <div>
                <span className="eyebrow"><span className="eyebrow-dot" /> Học liệu tùy chỉnh</span>
                <h2 id="bank-title">Thư viện cặp kiến thức</h2>
                <p>Nội dung được tự động lưu trên thiết bị này.</p>
              </div>
              <button className="close-button" onClick={() => setBankOpen(false)} aria-label="Đóng">×</button>
            </header>

            <div className="bank-toolbar">
              <span><strong>{validPairCount}</strong> cặp hợp lệ</span>
              <div>
                <button className="text-button" onClick={exportBank}>Xuất tệp JSON</button>
                <label className="text-button file-button">Nhập tệp JSON<input type="file" accept="application/json,.json" onChange={importBank} /></label>
                <button className="text-button text-button--danger" onClick={restoreSamples}>Khôi phục mẫu</button>
              </div>
            </div>

            <div className="add-pair-panel">
              <h3>Thêm một cặp mới</h3>
              <div className="pair-entry-row">
                <textarea placeholder="Nội dung thẻ A" value={newPair.left} onChange={(event) => setNewPair({ ...newPair, left: event.target.value })} />
                <span className="link-symbol" aria-hidden="true">↔</span>
                <textarea placeholder="Nội dung thẻ B tương ứng" value={newPair.right} onChange={(event) => setNewPair({ ...newPair, right: event.target.value })} />
                <button className="add-button" onClick={addPair}>Thêm</button>
              </div>
              <details className="bulk-add">
                <summary>Thêm nhanh nhiều cặp</summary>
                <p>Mỗi dòng là một cặp, ngăn cách hai thẻ bằng dấu |</p>
                <textarea className="bulk-textarea" placeholder={"Thẻ A1 | Thẻ B1\nThẻ A2 | Thẻ B2"} value={bulkText} onChange={(event) => setBulkText(event.target.value)} />
                <button className="small-button" onClick={addBulkPairs}>Thêm các dòng hợp lệ</button>
              </details>
              {bankMessage && <p className="bank-message" role="status">{bankMessage}</p>}
            </div>

            <div className="pair-list">
              {pairBank.map((pair, index) => (
                <article className="pair-row" key={pair.id}>
                  <span className="pair-index">{String(index + 1).padStart(2, "0")}</span>
                  <textarea aria-label={`Thẻ A của cặp ${index + 1}`} value={pair.left} onChange={(event) => updatePair(pair.id, "left", event.target.value)} />
                  <span className="link-symbol" aria-hidden="true">↔</span>
                  <textarea aria-label={`Thẻ B của cặp ${index + 1}`} value={pair.right} onChange={(event) => updatePair(pair.id, "right", event.target.value)} />
                  <button className="delete-button" onClick={() => removePair(pair.id)} aria-label={`Xóa cặp ${index + 1}`}>×</button>
                </article>
              ))}
              {!pairBank.length && <div className="empty-bank">Ngân hàng đang trống. Hãy thêm ít nhất 5 cặp.</div>}
            </div>

            <footer className="bank-footer">
              <span>Mỗi trận sử dụng 5 cặp ngẫu nhiên.</span>
              <button className="primary-button primary-button--inline" onClick={() => setBankOpen(false)}>Hoàn tất</button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
