// Data menu Tanspace (harga contoh, silakan sesuaikan)
// tag: "Best Seller", "Baru", "Pedas", dst. (boleh dikosongkan)
const raw = [
  {
    id: 'kopi', name: 'Kopi', icon: 'cup',
    items: [
      { name: 'Espresso', price: 18000, desc: 'Shot tunggal yang pekat dan harum.' },
      { name: 'Americano', price: 22000, desc: 'Espresso dengan air panas, ringan dan bersih.' },
      { name: 'Latte', price: 28000, desc: 'Espresso dan susu lembut, pilihan paling aman.' },
      { name: 'Cappuccino', price: 28000, desc: 'Busa susu tebal dengan rasa kopi yang kuat.' },
      { name: 'Flat White', price: 30000, desc: 'Lebih pekat dari latte, teksturnya halus.' },
      { name: 'Kopi Susu Tanspace', price: 26000, desc: 'Racikan andalan dengan gula aren.', tag: 'Best Seller' },
      { name: 'Caramel Macchiato', price: 32000, desc: 'Manis karamel dengan lapisan espresso.' },
      { name: 'Mocha', price: 30000, desc: 'Kopi dan cokelat dalam satu gelas.' },
      { name: 'V60 Manual Brew', price: 30000, desc: 'Seduh manual, rasa biji kopi lebih terasa.' },
      { name: 'Affogato', price: 32000, desc: 'Es krim vanila disiram espresso panas.', tag: 'Baru' },
    ],
  },
  {
    id: 'nonkopi', name: 'Non-Kopi', icon: 'glass',
    items: [
      { name: 'Matcha Latte', price: 28000, desc: 'Teh hijau dengan susu, segar dan lembut.', tag: 'Best Seller' },
      { name: 'Cokelat Panas', price: 25000, desc: 'Cokelat pekat yang menghangatkan.' },
      { name: 'Teh Tarik', price: 20000, desc: 'Teh dengan susu, manis yang pas.' },
      { name: 'Lemon Tea', price: 18000, desc: 'Segar dan ringan, cocok saat siang.' },
      { name: 'Thai Tea', price: 22000, desc: 'Teh khas Thailand, manis dan creamy.' },
      { name: 'Red Velvet Latte', price: 28000, desc: 'Lembut, manis, dengan aroma vanila.' },
      { name: 'Taro Latte', price: 27000, desc: 'Rasa talas yang gurih manis.', tag: 'Baru' },
      { name: 'Es Jeruk Segar', price: 20000, desc: 'Jeruk peras asli, tanpa pemanis tambahan.' },
    ],
  },
  {
    id: 'makanan', name: 'Makanan', icon: 'plate',
    items: [
      { name: 'Nasi Goreng Tanspace', price: 35000, desc: 'Nasi goreng dengan telur dan acar.', tag: 'Best Seller' },
      { name: 'Mie Goreng Spesial', price: 32000, desc: 'Mie goreng dengan sayur, telur, dan bakso.' },
      { name: 'Chicken Katsu Rice', price: 38000, desc: 'Ayam katsu renyah dengan saus dan nasi.' },
      { name: 'Beef Rice Bowl', price: 40000, desc: 'Irisan daging sapi dengan saus teriyaki.' },
      { name: 'Spaghetti Aglio Olio', price: 36000, desc: 'Bawang putih, cabai, dan minyak zaitun.', tag: 'Pedas' },
      { name: 'Club Sandwich', price: 34000, desc: 'Tiga lapis roti dengan ayam, telur, dan sayur.' },
      { name: 'Croissant Butter', price: 24000, desc: 'Renyah di luar, lembut di dalam.' },
      { name: 'Chicken Wings (6 pcs)', price: 35000, desc: 'Sayap ayam goreng dengan saus pilihan.', tag: 'Pedas' },
    ],
  },
  {
    id: 'camilan', name: 'Camilan & Dessert', icon: 'cake',
    items: [
      { name: 'Kentang Goreng', price: 20000, desc: 'Gurih, enak untuk dibagi berdua.' },
      { name: 'Roti Bakar Cokelat', price: 22000, desc: 'Teman sempurna untuk kopi sore.' },
      { name: 'Pisang Goreng Keju', price: 20000, desc: 'Pisang goreng hangat dengan keju parut.' },
      { name: 'Cireng Rujak', price: 18000, desc: 'Cireng renyah dengan sambal rujak.', tag: 'Pedas' },
      { name: 'Tiramisu', price: 30000, desc: 'Lapisan kopi dan krim mascarpone.' },
      { name: 'Cheesecake', price: 32000, desc: 'Lembut dan creamy dengan dasar biskuit.' },
      { name: 'Brownies Ice Cream', price: 30000, desc: 'Brownies hangat dengan es krim vanila.', tag: 'Baru' },
      { name: 'Churros', price: 25000, desc: 'Renyah, ditaburi gula kayu manis.' },
    ],
  },
];

// Beri id unik otomatis, misalnya "kopi-0", "kopi-1"
export const categories = raw.map((c) => ({
  ...c,
  items: c.items.map((it, i) => ({ ...it, id: `${c.id}-${i}` })),
}));