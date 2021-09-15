import React, { useState, useEffect } from "react";

import CreateGameScreen from "./CreateGameScreen";
import Navbar from "../components/Navbar";
import BottomBar from "../components/bottomBar/BottomBar";
import MainScreen from "./MainScreen";

import { PlayerClass } from "./../Data/PlayerClass";

import "./App.css";
import Pay from "./Pay";

export default function App() {
    //Player List
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        setPlayers([
            new PlayerClass("Manuel", "TestIcon", setPlayers),
            new PlayerClass("Cringo", "TestIcon", setPlayers)
        ]);
    }, []);

    //Game State
    const [gameState, setgameState] = useState("createGame");

    // Determine which main Content to load
    function Content() {
        if (gameState === "createGame")
            return (
                <CreateGameScreen
                    players={players}
                    setPlayers={setPlayers}
                    setgameState={setgameState}
                />
            );
        else if (gameState === "main")
            return <MainScreen setgameState={setgameState} />;
        else if (gameState === "pay")
            return <Pay players={players} setPlayers={setPlayers} />;
    }

    return (
        <header className="App-header">
            <Navbar setgameState={setgameState} />
            <Content />
            <BottomBar players={players} />
        </header>
    );
}
