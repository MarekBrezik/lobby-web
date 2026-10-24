export const menu = [
  {
    id: 'demo', demo: true, name: 'Demo nabídka', subtitle: 'Ukázka fotografických karet', layout: 'cards', note: 'Pouze ukázka grafického řešení. Fotografie jsou převzaté z návrhového PDF a nepředstavují ověřené produkty kavárny. Názvy jsou ilustrační, ceny záměrně neuvádíme.',
    items: [
      { name: 'Slané ráno', image: '/assets/demo-1.webp', imageLabel: 'Ilustrační fotografie snídaně', description: 'Demo / prostor pro název, krátký popis a cenu.' },
      { name: 'Brunch bez spěchu', image: '/assets/demo-3.webp', imageLabel: 'Ilustrační fotografie brunche', description: 'Demo / fotografie bude u každé položky volitelná.' },
      { name: 'Sladká chvíle', image: '/assets/demo-2.webp', imageLabel: 'Ilustrační fotografie snídaňové misky', description: 'Demo / textový lístek níže funguje i bez fotografií.' },
    ],
  },
  {
    id: 'podzim', schemaName: 'Podzimní nabídka', name: 'Demo 02 / Autumn edition', subtitle: 'Sezónní nabídka · říjen 2026', layout: 'mixed', note: 'Skutečná podzimní nabídka podle dodaného PDF (10/2026). Ukázka kombinace textových položek a fotografií. Fotografie jsou pouze ilustrační, nikoliv fotografie uvedených jídel.',
    groups: [
      { name: 'Podzim ve sklenici', items: [
        { name: 'Sirupy do kávy', price: '10 Kč', description: 'Perníček / pumpkin spice' },
        { name: 'Batch & fresh hot/cold', amount: '0,30 l', price: '99 Kč', description: 'Grepový fresh / pomerančový fresh' },
        { name: 'Dirty chai latte', amount: '0,25 l', price: '109 Kč' },
        { name: 'Horká čokoláda Ajala', amount: '0,30 l', price: '89 Kč' },
        { name: 'Pumpkin spice matcha', amount: '0,25 l', price: '119 Kč' },
        { name: 'Matcha & apple', amount: '0,30 l', price: '119 Kč' },
        { name: 'Naše limonáda', amount: '0,40 l', price: '80 Kč', description: 'Hruška / zázvor' },
        { name: 'Horká hruška', amount: '0,30 l', price: '79 Kč' },
        { name: 'Horký jablečný mošt', amount: '0,30 l', price: '79 Kč' },
        { name: 'Apple cider ginger beer', amount: '0,25 l', price: '119 Kč', description: 'Jablečný mošt, ginger beer tonic, sugar cold foam' },
        { name: 'Hrušková mimosa', amount: '0,15 l', price: '129 Kč' },
      ] },
      { name: 'Snídaně do 14:00', items: [
        { name: 'Mushroom bread', price: '159 Kč', description: 'Křupavý kváskový chléb, nadýchané bylinkové žervé a šťavnaté lesní hříbky dušené na bílém víně', allergens: '1, 7, 9, 10, 11, 12' },
        { name: 'Bacon & eggs', price: '159 Kč', image: '/assets/demo-1.webp', imageLabel: 'Ilustrační fotografie snídaně', description: 'Poctivá snídaně ze tří sázených vajec s křupavou slaninou a rozpuštěným cheddarem, podávaná s lehkým salátkem, kečupem nebo chilli olejem', allergens: '1, 3, 7' },
        { name: 'Polévka dle denní nabídky', price: '89 Kč', description: 'Hřejivá sezónní polévka podávaná s poctivým zrnným chlebem', allergens: 'Dle denní polévky' },
        { name: 'Tiramisu French toast', price: '179 Kč', description: 'Naše máslová vánočka opečená do zlatova, jemný mascarpone krém s tiramisu nádechem, silný kávový přeliv a svěží ovoce', allergens: '1, 3, 7' },
        { name: 'Ovesný crumble', price: '129 Kč', image: '/assets/demo-2.webp', imageLabel: 'Ilustrační fotografie snídaňové misky', description: 'Pečené ovesné vločky s holandským kakaem a čokoládou, doplněné praženými ořechy a ovocem dle denní nabídky', allergens: '3, 6, 7, 8, 12' },
      ] },
      { name: 'Navíc', note: 'U položek bez ceny není cena v podkladu uvedena. Ověřte ji prosím u obsluhy.', items: [
        { name: 'Slanina', price: '20 Kč' },
        { name: 'Mini párečky' },
        { name: 'Bylinkové žervé' },
        { name: 'Guacamole' },
        { name: 'Pečivo', description: 'Možné i v bezlepkové variantě' },
      ] },
    ],
  },
  {
    id: 'kava', name: 'Káva', note: 'Bezkofeinová varianta možná u všech druhů káv. Všechny kávy lze připravit i s ledem.',
    items: [
      { name: 'Espresso', amount: '30 ml', price: '60 Kč' },
      { name: 'Doppio', amount: '60 ml', price: '85 Kč' },
      { name: 'Ristretto', amount: '20 ml', price: '60 Kč' },
      { name: 'Lungo', amount: '90 ml', price: '60 Kč' },
      { name: 'Americano', amount: '180 ml', price: '65 Kč' },
      { name: 'Espresso Macchiato', amount: '50 ml', price: '70 Kč' },
      { name: 'Cappuccino', amount: '150 ml', price: '85 Kč' },
      { name: 'Cortado', amount: '90 ml', price: '80 Kč' },
      { name: 'Caffè Latte', amount: '250 ml', price: '90 Kč' },
      { name: 'Flat White', amount: '160 ml', price: '95 Kč' },
      { name: 'Cold Brew', amount: '250 ml', price: '90 Kč' },
      { name: 'Espresso Tonic', amount: '250 ml', price: '110 Kč' },
      { name: 'Batch brew', amount: '200 / 300 ml', price: '75 / 95 Kč' },
    ],
  },
  {
    id: 'snidane', name: 'Snídaně & brunch', groups: [
      { name: 'Slané', items: [
        { name: 'Míchaná vejce', amount: '250 g', price: '149 Kč', description: '3 ks farmářských vajec, kváskový chléb, domácí máslo, salátek s rajčaty' },
        { name: 'Vejce do skla', amount: '200 g', price: '169 Kč', description: 'Parmezán, pažitka, kváskový chléb, domácí máslo' },
        { name: 'Vejce benedikt', amount: '300 g', price: '240 Kč', description: 'Vysoký toasták, varianta šunka, omáčka THOMY' },
        { name: 'Anglická snídaně', amount: '400 g', price: '235 Kč', description: 'Grilovaná cherry rajčátka, klobáska/páreček, opečená slanina, volské oko, fazolky v omáčce, kváskový chléb, domácí máslo' },
        { name: 'Turecká vejce', amount: '250 g', price: '190 Kč' },
        { name: 'Avokádový chléb', amount: '200 g', price: '149 Kč', description: 'Domácí chléb, guacamole, směs koření' },
      ] },
      { name: 'Sladké', items: [
        { name: 'Belgická wafle nebo lívance', amount: '250 g', price: '170 Kč', description: 'Čerstvé jahody, mascarpone, javorový sirup' },
        { name: 'Chia bowl', amount: '350 g', price: '169 Kč', description: 'Řecký jogurt, domácí granola, čerstvé ovoce, chia semínka' },
      ] },
    ],
  },
  {
    id: 'limonady', name: 'Limonády & fresh', groups: [
      { name: 'Domácí limonády', items: [
        { name: 'Grapefruit', amount: '400 ml', price: '80 Kč' },
        { name: 'Jahoda', amount: '400 ml', price: '80 Kč' },
        { name: 'Malina', amount: '400 ml', price: '80 Kč' },
        { name: 'Bezinka', amount: '400 ml', price: '80 Kč' },
        { name: 'Levandule', amount: '400 ml', price: '90 Kč' },
      ] },
      { name: 'Fresh', items: [
        { name: 'Pomeranč', amount: '200 ml', price: '90 Kč' },
        { name: 'Grapefruit', amount: '200 ml', price: '90 Kč' },
      ] },
    ],
  },
  {
    id: 'matcha', name: 'Matcha & čaje', items: [
      { name: 'Matcha latte', amount: '250 ml', price: '110 Kč' },
      { name: 'Iced Matcha', amount: '300 ml', price: '130 Kč', description: 'Mango, jahoda, malina' },
      { name: 'Chai latte', amount: '250 ml', price: '90 Kč' },
      { name: 'Výběr sypaných čajů', amount: '400 ml', price: '80 Kč' },
      { name: 'Černý ledový čaj', amount: '300 ml', price: '90 Kč' },
    ],
  },
  {
    id: 'napoje', name: 'Nealkoholické nápoje', items: [
      { name: 'Coca-Cola / Coca-Cola Zero', amount: '330 ml', price: '55 Kč' },
      { name: 'Kombucha', amount: '330 ml', price: '85 Kč' },
      { name: 'Tonic', amount: '200 ml', price: '55 Kč', description: 'Různé příchutě' },
      { name: 'Birell / Bernard nealko', amount: '330 ml', price: '50 Kč' },
      { name: 'Mattoni', amount: '330 ml', price: '45 Kč', description: 'Perlivá / neperlivá' },
      { name: 'Džus', amount: '200 ml', price: '55 Kč', description: 'Různé příchutě' },
    ],
  },
  {
    id: 'obedy', name: 'Obědy & snacky', items: [
      { name: 'Denní polévka', amount: '330 ml', price: '60 Kč', description: 'Podávaná s kváskovým chlebem nebo focacciou' },
      { name: 'Caesar salát', amount: '350 g', price: '169 Kč', description: 'Kuřecí maso, římský salát, parmezán, krutony' },
      { name: 'Club sandwich', amount: '350 g', price: '169 Kč', description: 'Kuřecí maso, slanina, salát, rajče, omáčka' },
      { name: 'Hranolky (vč. batátových)', amount: '200 g', price: '85 Kč' },
      { name: 'Sladké dezerty', price: 'Dle nabídky' },
      { name: 'Kváskový chléb', amount: '200 g', price: '120 Kč' },
      { name: 'Focaccia', amount: '150 g', price: '130 Kč' },
    ],
  },
  {
    id: 'drinky', name: 'Drinky & pivo', items: [
      { name: 'Aperol Spritz', amount: '200 ml', price: '140 Kč' },
      { name: 'Gin Tonic', amount: '200 ml', price: '140 Kč' },
      { name: 'Mimosa', amount: '150 ml', price: '120 Kč' },
      { name: 'Cosmopolitan', amount: '100 ml', price: '150 Kč' },
      { name: 'Mojito', amount: '300 ml', price: '150 Kč' },
      { name: 'Margarita', amount: '100 ml', price: '150 Kč' },
      { name: 'Daiquiri', amount: '100 ml', price: '150 Kč' },
      { name: 'Skinny Bitch', amount: '200 ml', price: '150 Kč' },
      { name: 'Peroni / Moretti', amount: '330 ml', price: '65 Kč' },
      { name: 'Corona', amount: '355 ml', price: '75 Kč' },
    ],
  },
  {
    id: 'vino', name: 'Vinný lístek', note: 'by Šebesta', items: [
      { name: 'Grüner Veltliner 2025, Schmelz, Wachau', amount: '100 ml', price: '95 Kč' },
      { name: 'Prosecco (sklenka)', amount: '100 ml', price: '85 Kč' },
      { name: 'Prosecco (láhev)', amount: '750 ml', price: '490 Kč' },
      { name: 'Víno (sklenka)', amount: '150 ml', price: '95 Kč' },
    ],
  },
  {
    id: 'extra', name: 'Něco navíc', items: [
      { name: 'Variace příchutí', price: '10 Kč' },
      { name: 'Alternativní mléka', price: '15 Kč', description: 'Ovesné, mandlové, kokosové' },
    ],
  },
];
