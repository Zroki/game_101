<script>
    import SinglePlayerMenu from "./singlePlayer/StartMenu.svelte";
    import SinglePlayerGame from "./singlePlayer/SinglePlayerGame.svelte";
    import MultiPlayerMenu from "./multiPlayer/StartMenu.svelte";
    import MultiPlayerGame from "./multiPlayer/MultiPlayerGame.svelte";

    import Lobby from './multiPlayer/lobby.svelte'

    let startMenu = true; // true

    let isShowSinglePlayerMenu = false;
    let isStartSinglePlayer = false;

    let isShowMultiPlayerMenu = false; // false
    let isStartMultiPlayer = false;
    let isStartLobby = false;

    class SinglePlayer {
        static showSinglePlayerMenu() {
            isShowSinglePlayerMenu = true;
            startMenu = false;
        }

        static startSinglePlayer() {
            isStartSinglePlayer = true;
            isShowSinglePlayerMenu = false;
            startMenu = false;
        }
    }

    class MultiPlayer {
        static showMultiPlayerMenu() {
            isShowMultiPlayerMenu = true;
            startMenu = false;
        }

        static startMultiPlayer() {
            isStartMultiPlayer = true;
            isShowMultiPlayerMenu = false;
            startMenu = false;
        }

        static startLobby() {
            isStartLobby = true;
            isShowMultiPlayerMenu = false;
        }
    }
</script>

<style>
    .title {
        text-align: center;
        font-size: 20px;
        font-weight: bold;
    }

    button {
        margin: 5px auto;
        background-color: #007eff;
        border: 1px solid #0400ffb0;
        padding: 5px 10px;
        color: white;
        font-weight: bold;
        border-radius: 5px;
        font-style: italic;
        cursor: pointer;
        transition: 0.4s;
        display: block;
    }

    button:hover {
        background-color: #0014ff;
        transition: 0.4s;
    }

    .main_menu {
        margin: 0 auto;
        width: max-content;
        border: 1px solid #00000014;
        border-radius: 5px;
        background-color: #f1f1f196;
        padding: 10px;
    }
</style>

<!-- Стартовое меню с выбором режима игры -->
{#if startMenu}
    <div class="main_menu">
        <h2 class="title">Игра "101"</h2>
        <button on:click={SinglePlayer.showSinglePlayerMenu}>Одиночная игра</button>
        <button on:click={MultiPlayer.showMultiPlayerMenu}>Сетевая игра</button>
    </div>
{/if}

<!-- Одиночный режим игры -->
{#if isShowSinglePlayerMenu}
    <SinglePlayerMenu on:start={SinglePlayer.startSinglePlayer}/>
{/if}
{#if isStartSinglePlayer}
    <SinglePlayerGame/>
{/if}

<!-- Сетевой режим игры -->
<!--{#if isShowMultiPlayerMenu}-->
<!--    <MultiPlayerMenu on:start={MultiPlayer.startMultiPlayer}/>-->
<!--{/if}-->
{#if isShowMultiPlayerMenu}
    <MultiPlayerMenu on:loginInLobby={MultiPlayer.startLobby}/>
{/if}
{#if isStartLobby}
    <Lobby></Lobby>
{/if}
<!--{#if isStartMultiPlayer}-->
<!--    <MultiPlayerGame/>-->
<!--{/if}-->
