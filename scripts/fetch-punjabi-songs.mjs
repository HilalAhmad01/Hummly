import fs from 'fs';

const rawSongs = [
  { title: "Kath Lagda", artist: "Navaan Sandhu, Dhanda Nyoliwala, Sanya Dandona, RXTRO" },
  { title: "Low Fade", artist: "Karan Aujla, Mxrci" },
  { title: "Eyes on Me", artist: "Sidhu Moose Wala, The Kidd" },
  { title: "Me Vs Me", artist: "Arjan Dhillon, Mxrci" },
  { title: "At Peace", artist: "Karan Aujla, Ikky" },
  { title: "Supreme", artist: "Shubh" },
  { title: "Take Notes", artist: "Sidhu Moose Wala, JayB Singh" },
  { title: "California Love", artist: "Cheema Y, Gur Sidhu" },
  { title: "Snake", artist: "Cheema Y, Gur Sidhu" },
  { title: "Sit Down Son", artist: "Navaan Sandhu, RXTRO, Avvy" },
  { title: "Courtside", artist: "Karan Aujla, Signature By SB" },
  { title: "410", artist: "Sidhu Moose Wala, Sunny Malton, Offgrid" },
  { title: "Brats", artist: "Arjan Dhillon" },
  { title: "Wavy", artist: "Karan Aujla, Jay Trak" },
  { title: "What We Do", artist: "Jxggi, Sickboi" },
  { title: "Fly", artist: "Arjan Dhillon, Mxrci" },
  { title: "Indeed", artist: "Cheema Y, Gur Sidhu" },
  { title: "Rounds N Ring", artist: "Yo Yo Honey Singh, Navaan Sandhu, Bonafide" },
  { title: "Damn Daddy", artist: "Prem Dhillon, Rass" },
  { title: "Old Money", artist: "AP Dhillon" },
  { title: "Ambarsaria", artist: "Navaan Sandhu, Homeboy, Kaater" },
  { title: "Goin' Off", artist: "Karan Aujla, Mxrci" },
  { title: "Forever", artist: "Tegi Pannu, Manni Sandhu, Prem Lata" },
  { title: "Nimm Thalle", artist: "Jordan Sandhu, Desi Crew" },
  { title: "ANTIDOTE", artist: "Karan Aujla" },
  { title: "Wealth", artist: "Cheema Y, Gur Sidhu" },
  { title: "What...?", artist: "Karan Aujla, Ikky" },
  { title: "Patti Ton Patiala", artist: "Harkirat Sangha, Starboy X" },
  { title: "Sikander", artist: "Karan Aujla" },
  { title: "Karha", artist: "Honey Sidhu" },
  { title: "Sin", artist: "Sidhu Moose Wala" },
  { title: "You and Me", artist: "Shubh" },
  { title: "Putt Jattan De", artist: "Mankirt Aulakh" },
  { title: "THAT'S WHY", artist: "Prem Dhillon, Simran Kaur" },
  { title: "King Shit", artist: "Shubh" },
  { title: "Youth Flow", artist: "Arjan Dhillon" },
  { title: "Na Ji Na", artist: "Khan Bhaini" },
  { title: "XL", artist: "Simar Dorraha, MixSingh" },
  { title: "Gunda", artist: "Varinder Brar, Rav Dhaliwal" },
  { title: "Duty", artist: "R Nait, Labh Heera, MixSingh" },
  { title: "Surma", artist: "Khan Bhaini, Raj Shoker" },
  { title: "Don't Tell Me", artist: "Dilpreet Dhillon, Karan Aujla, Gurlez Akhtar" },
  { title: "Kaafla", artist: "Varinder Brar" },
  { title: "Kikli", artist: "Kptaan, GHXST" },
  { title: "Clutch Baliye", artist: "Sultaan, Gagan" },
  { title: "Qatal", artist: "Jordan Sandhu, Shree Brar, Avvy Sra" },
  { title: "The Jatts", artist: "Varinder Brar" },
  { title: "Hood Famous", artist: "Navaan Sandhu" },
  { title: "Faraar", artist: "Gurinder Gill, Shinda Kahlon, AP Dhillon" },
  { title: "Safety Off", artist: "Shubh" },
  { title: "Numb", artist: "Khan Bhaini" },
  { title: "Take It Easy", artist: "Karan Aujla, Ikky" },
  { title: "Check It Out", artist: "Parmish Verma, Paradox" },
  { title: "Rubicon Drill", artist: "Laddi Chahal, Parmish Verma, Gurlez Akhtar" },
  { title: "8 ASLE", artist: "Sukha, Chani Nattan, Prodgk, Gurlez Akhtar" },
  { title: "Her", artist: "Shubh" },
  { title: "Wytb", artist: "Karan Aujla, Gurlez Akhtar" },
  { title: "Yaaran Di Gaddi", artist: "Happy Raikoti" },
  { title: "Born to Shine", artist: "Diljit Dosanjh" },
  { title: "OG", artist: "Prem Dhillon" },
  { title: "We Rollin", artist: "Shubh" },
  { title: "Jatt te Jawani", artist: "Dilpreet Dhillon, Karan Aujla" },
  { title: "DESIRES", artist: "AP Dhillon, Gurinder Gill" },
  { title: "Lemonade", artist: "Diljit Dosanjh" },
  { title: "Black Life", artist: "Navaan Sandhu" },
  { title: "GODSPEED", artist: "Tyson Sidhu" },
  { title: "Mood Swings", artist: "Tegi Pannu, Manni Sandhu" },
  { title: "Excuses", artist: "AP Dhillon, Gurinder Gill, Intense" },
  { title: "On Top", artist: "Karan Aujla" },
  { title: "Chauffeur", artist: "Diljit Dosanjh, Tory Lanez, Ikky" },
  { title: "Top Notch Gabru", artist: "Vicky Dhillon" },
  { title: "24/7", artist: "Navaan Sandhu" },
  { title: "DEAD ZONE", artist: "Gulab Sidhu, Jay Dee, JAGDEEEP SANGALA" },
  { title: "Dead Mangde", artist: "Navaan Sandhu" },
  { title: "Few Days", artist: "Amantej Hundal, Karan Aujla" },
  { title: "12 Bande", artist: "Varinder Brar" },
  { title: "Brown Munde", artist: "AP Dhillon, Gminxr, Gurinder Gill, Shinda Kahlon" },
  { title: "Don't Look", artist: "Karan Aujla" },
  { title: "Gym", artist: "Harf Cheema" },
  { title: "Tension", artist: "NIJJAR, Karan Aujla" },
  { title: "Dollar", artist: "Saabi Bhinder" },
  { title: "Riyasat", artist: "Navaan Sandhu, Saabi Bhinder" },
  { title: "Same Beef", artist: "Bohemia, Sidhu Moose Wala" },
  { title: "Gutt", artist: "Arjan Dhillon" },
  { title: "Yahama", artist: "Shree Brar" },
  { title: "Schedule", artist: "Tegi Pannu, Manni Sandhu" },
  { title: "Gall Khaas", artist: "Zehr Vibe" },
  { title: "Jealousy", artist: "Navaan Sandhu, Gurlez Akhtar" },
  { title: "All Aces", artist: "Prem Dhillon, Byg Byrd, Blamo" },
  { title: "Nah They Can’t", artist: "Prem Dhillon" },
  { title: "Notorious", artist: "Wazir Patar" },
  { title: "Elevated", artist: "Shubh" },
  { title: "Untouchable", artist: "Tegi Pannu, Manni Sandhu" },
];

async function fetchFromDeezer(title, artist) {
  const primaryArtist = artist.split(',')[0].trim();
  const queries = [
    `${title} ${primaryArtist}`,
    title
  ];

  for (const q of queries) {
    try {
      const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=5`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const match = data.data.find(d => 
          d.preview && (
            d.title.toLowerCase().includes(title.toLowerCase().split(' ')[0]) ||
            d.artist.name.toLowerCase().includes(primaryArtist.toLowerCase())
          )
        ) || data.data[0];

        if (match && match.preview) {
          return {
            previewUrl: match.preview,
            coverUrl: match.album?.cover_big || match.album?.cover_medium || match.artist?.picture_big,
            album: match.album?.title || `${title} - Single`,
            year: 2022
          };
        }
      }
    } catch (e) {}
  }
  return null;
}

async function fetchFromITunes(title, artist) {
  const primaryArtist = artist.split(',')[0].trim();
  const countries = ['in', 'us', 'ca', 'gb'];
  const queries = [
    `${title} ${primaryArtist}`,
    `${title} ${artist}`,
    title,
  ];

  for (const country of countries) {
    for (const q of queries) {
      try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=5&country=${country}`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const best = data.results.find(r => 
            r.previewUrl && (
              r.trackName.toLowerCase().includes(title.toLowerCase().split(' ')[0]) ||
              r.artistName.toLowerCase().includes(primaryArtist.toLowerCase())
            )
          ) || data.results[0];

          if (best && best.previewUrl) {
            return {
              previewUrl: best.previewUrl,
              coverUrl: best.artworkUrl100 ? best.artworkUrl100.replace('100x100bb', '600x600bb') : null,
              album: best.collectionName || best.trackName,
              year: best.releaseDate ? new Date(best.releaseDate).getFullYear() : 2022
            };
          }
        }
      } catch (e) {}
    }
  }
  return null;
}

async function run() {
  const curated = [];
  const searchable = [];

  console.log(`Starting comprehensive multi-source fetch for ${rawSongs.length} songs...`);

  for (let i = 0; i < rawSongs.length; i++) {
    const item = rawSongs[i];
    const id = `punjabi-${String(i + 1).padStart(3, '0')}`;
    
    // Try iTunes first, fallback to Deezer
    let match = await fetchFromITunes(item.title, item.artist);
    if (!match || !match.previewUrl) {
      match = await fetchFromDeezer(item.title, item.artist);
    }

    const song = {
      id,
      title: item.title,
      artist: item.artist,
      movie_or_album: match?.album || `${item.title} - Single`,
      language: "punjabi",
      era: "punjabi",
      theme: "party",
      year: match?.year || 2023,
      deezer_preview_url: match?.previewUrl || null,
      cover_url: match?.coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
      youtube_video_id: null,
      is_active: true
    };

    const sSong = {
      id,
      title: item.title,
      artist: item.artist,
      movie_or_album: match?.album || `${item.title} - Single`,
      year: match?.year || 2023,
      cover_url: match?.coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
      era: "punjabi"
    };

    curated.push(song);
    searchable.push(sSong);

    console.log(`[${i+1}/${rawSongs.length}] ${item.title} - ${item.artist} -> ${match?.previewUrl ? '✅' : '❌'}`);
    await new Promise(r => setTimeout(r, 120));
  }

  const validCount = curated.filter(s => !!s.deezer_preview_url).length;
  console.log(`\n🎉 Completed! ${validCount}/${rawSongs.length} songs have playable audio previews!`);

  fs.writeFileSync('scripts/punjabi-songs.json', JSON.stringify({ curated, searchable }, null, 2));
}

run();
