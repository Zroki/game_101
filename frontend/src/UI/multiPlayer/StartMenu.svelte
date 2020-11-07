<script>
    // import {createEventDispatcher} from "svelte";

    // const dispatch = createEventDispatcher();

    let playerName = "";

    class Game {
        static addNewPlayer() {
            if (playerName !== "") {
                playerName = "";
            }
        }

        // static startNewGame() {
        //     dispatch("start");
        // }
    }
</script>

<style>
    .start_main {
        margin: 0 auto;
        width: 25%;
        text-align: center;
    }

    .start_adding_new_players {
        border: 1px solid #00000014;
        border-radius: 5px;
        background-color: #f1f1f196;
        padding: 10px;
    }

    .start_adding_new_players h2 {
        margin: 5px 0;
    }

    .start_adding_new_players button,
    .start_new_game button {
        margin: 5px 0;
        background-color: #007eff;
        border: 1px solid #0400ffb0;
        padding: 5px 10px;
        color: white;
        font-weight: bold;
        border-radius: 5px;
        font-style: italic;
        cursor: pointer;
        transition: 0.4s;
    }

    .start_adding_new_players button:hover,
    .start_new_game button:hover {
        background-color: #0014ff;
        transition: 0.4s;
    }

    .start_adding_new_players input {
        box-sizing: border-box;
        margin: 5px auto;
        font-family: inherit;
        overflow: visible;
        display: block;
        color: #495057;
        background-color: #fff;
        background-clip: padding-box;
        border: 1px solid #ced4da;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        line-height: 1.5;
        border-radius: 0.2rem;
        position: relative;
        flex: 1 1 auto;
        width: 100%;
    }
</style>

<div class="start_main">
    <div class="start_adding_new_players">
        <h2>Введите имя игрока</h2>
        <label for="player_name">
            <input type="text" id="player_name" bind:value={playerName}/>
        </label>
        <button on:click={Game.addNewPlayer}>Добавить игрока</button>
    </div>
    <div class="list_players">
        <!--{#if $players.length !== 0}-->
        <!--    <h2>Добавленные игроки</h2>-->
        <!--{/if}-->
        <!--{#each $players as player, index (player)}-->
        <!--    <p>{player.name}</p>-->
        <!--{/each}-->
    </div>
<!--    <div class="start_new_game">-->
<!--        <button on:click={Game.startNewGame}>Новая игра</button>-->
<!--    </div>-->
</div>
