<script>
    import {players} from "../../store";

    function addScorePlayer(player, score) {
        player.addScore(score);
        $players = [...$players];
    }

    function resetScorePlayer(player) {
        player.resetScore();
        $players = [...$players];
    }
</script>

<style>
    .lose {
        color: red;
    }

    .text_bold {
        font-weight: bold;
    }

    .game_field {
        width: 35%;
        margin: 0 auto;
        text-align: center;
    }

    .player_interface {
        border: 1px solid #8a8a8a;
        background-color: #e6e0246e;
        border-radius: 3px;
        margin-bottom: 15px;
        padding: 10px;
    }

    h2 {
        margin: 0;
        margin-bottom: 10px;
    }

    button {
        margin: 5px 3px;
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

    button:hover {
        background-color: #0014ff;
        transition: 0.4s;
    }
</style>

<div class="game_field">
    {#each $players as player, index (player)}
        <div class="player_interface">
            {#if player.score > 101}
                <h2 class="lose">
                    {player.name}
                    || Очки:{player.score}
                    <span class="text_bold">Проигрыш</span>
                </h2>
            {:else}
                <h2>{player.name} || Очки:{player.score}</h2>
            {/if}
            {#each player.cards as card, index (index)}
                <button value={card.value} on:click={addScorePlayer(player, card.value)}>{card.card}</button>
            {/each}
            <button on:click={resetScorePlayer(player)}>Сброс</button>
            <button on:click={addScorePlayer(player, -20)}>-20</button>
            <button on:click={addScorePlayer(player, -40)}>-40</button>
        </div>
    {/each}
</div>
