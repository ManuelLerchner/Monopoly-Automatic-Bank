import React from "react";
import Logo from "../components/logo/Logo";
import MainMenu from "../components/mainScreen/MainScreen";

import $ from "jquery";

export default function MainScreen({ setgameState }) {
    $("#navbar_lobby").removeClass("selected");
    $("#navbar_main").addClass("selected");
    $("#navbar_pay").removeClass("selected");
    $("#navbar_buy").removeClass("selected");
    $("#navbar_start").removeClass("selected");
    $("#navbar_stock").removeClass("selected");

    return (
        <>
            <Logo />
            <MainMenu setgameState={setgameState} />
        </>
    );
}
