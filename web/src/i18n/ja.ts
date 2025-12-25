export const ja = {
    app: {
        description: "AI プレイヤと対戦ができます。",
        howToPlay: "ルールを見る",
        loading: "AI起動中...",
        opponent: "AI",
        you: "あなた",
        undo: "一手戻す",
        newGame: "最初から",
        settings: "設定",
        footer: "Powered by AlphaZero & WebAssembly"
    },
    board: {
        placeTile: "タイルを使用しますか？",
        tileBlack: "黒 (斜め)",
        tileGray: "グレー (全方向)",
        skip: "使用しない",
        cancel: "キャンセル",
        description: "タイルを置く場所を選択するか、使用しないを選択してください。"
    },
    controls: {
        victory: "勝利！",
        defeat: "敗北...",
        yourTurn: "あなたの番です",
        aiThinking: "AI思考中...",
        undo: "1手戻す",
        newGame: "最初から"
    },
    settings: {
        aiStrength: "AIの強さ",
        weak: "弱い",
        normal: "普通",
        strong: "強い",
        custom: "カスタム",
        selectSide: "手番選択",
        first: "先手 (赤)",
        second: "後手 (青)"
    },
    resources: {
        black: "黒 (Black)",
        gray: "グレー (Gray)",
        red: "赤",
        blue: "青",
        player1: "プレイヤー 1",
        player2: "プレイヤー 2"
    },
    rules: {
        title: "遊び方 (ルール)",
        gotIt: "わかった！",
        objectiveTitle: "1. 勝利条件",
        objective: "自分の駒を、相手の陣地（一番奥の列）に到達させれば勝利です。",
        objectiveNote: "*最初に到達した時点でゲーム終了となります。",
        movementTitle: "2. \"コントラスト\" 移動ルール",
        movement: "駒の移動可能方向は、現在乗っているタイルの色によって変化します。",
        whiteTile: "白いタイル",
        whiteMove: "十字方向に移動可能 (上下左右)",
        blackTile: "黒いタイル",
        blackMove: "斜め方向に移動可能",
        grayTile: "グレーのタイル",
        grayMove: "全8方向に移動可能",
        placementTitle: "3. タイルの配置",
        placement: "駒を移動させた際、手持ちのタイルがあれば、移動先のタイルの色を変えることができます。",
        placementList: [
            "黒とグレーのタイルは枚数に限りがあります。",
            "自分の駒を有利に動かすため、または相手の動きを封じるために使いましょう。",
            "タイルの配置は任意です。"
        ]
    }
};
