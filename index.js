require('dotenv').config();
const Twit = require('twit');
const axios = require('axios').default;

console.log('Bot is working');

const client = new Twit({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    timeout_ms: 60 * 1000,  // optional HTTP request timeout to apply to all requests.
    strictSSL: true,     // optional - requires SSL certificates to be valid.
});

const stream = client.stream('statuses/filter', { track: '@TheOfficeBotCo' });

const getQuote = async () => {
    const response = await axios.get('https://officeapi.dev/api/quotes/random');
    const quote = `${await response.data.data.content} - ${await response.data.data.character.firstname}`;
    return quote;
};

const quoteLimitChecked = async () => {
    let quote = await getQuote();

    while (quote.length > 280){
        console.log('Quote too long, getting another...');
        quote = await getQuote();
    }
    console.log('Quote retrieved:', quote);
    return quote
};

const postTweet = async () => {
    let quoteToTweet = await quoteLimitChecked();

    client.post('statuses/update', { status: quoteToTweet }, function(err, data, response) {
        console.log(`Sent tweet: ${data.text}`)
      });
};

const postReply = async (event) => {
    let quoteToTweet = await quoteLimitChecked();
    const user = event.user.screen_name; // getting @
    const tweetId = event.id_str; // getting tweet id

    client.post('statuses/update', { status: `@${user} ${quoteToTweet}`, in_reply_to_status_id: tweetId }, function (err, data, response) {
        console.log(`Sent tweet to ${user}: ${data.text}`) // logging the outcome to see how it went
    })
};

stream.on('tweet', postReply);

postTweet();
setInterval(postTweet, 1000 * 60 * 30);