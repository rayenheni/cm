<?php
declare(strict_types=1);
namespace CMCB;

final class Content
{
    private array $data;
    private array $ui;
    public readonly string $lang;
    public function __construct(string $lang = 'fr')
    {
        $this->lang = $lang === 'ar' ? 'ar' : 'fr';
        $all = json_decode(file_get_contents(dirname(__DIR__) . '/resources/content.json'), true, 512, JSON_THROW_ON_ERROR);
        $this->data = $all[$this->lang];
        if ($this->lang === 'ar' && isset($this->data['cabinet']['whatsappMsg'])) $this->data['cabinet']['whatsappHref'] = 'https://wa.me/' . $this->data['cabinet']['whatsapp'] . '?text=' . rawurlencode($this->data['cabinet']['whatsappMsg']);
        $all = json_decode(file_get_contents(dirname(__DIR__) . '/resources/ui.json'), true, 512, JSON_THROW_ON_ERROR);
        $this->ui = $all[$this->lang];
    }
    public function __get(string $key): mixed { return $this->data[$key] ?? null; }
    public function t(string $path): mixed
    {
        $value = $this->ui;
        foreach (explode('.', $path) as $key) { if (!is_array($value) || !array_key_exists($key, $value)) return $path; $value = $value[$key]; }
        return $value;
    }
    public function url(string $path = '/'): string { return $path . ($this->lang === 'ar' ? '?lang=ar' : ''); }
    public function fill(string $text): string
    {
        $c = $this->cabinet; $fr = $this->lang === 'fr';
        return strtr($text, [
            '__EDITOR1__' => $fr ? "Le site {$c['domain']} est édité par le cabinet CMCB avocat et conseils — {$c['lawyer']}, {$c['role']}, " . mb_strtolower($c['specialty']) . '.' : "موقع {$c['domain']} يصدر عن مكتب CMCB للمحاماة والاستشارات — {$c['lawyer']}، {$c['role']}، {$c['specialty']}.",
            '__EDITOR2__' => $fr ? "Adresse : {$c['address']}, {$c['city']}. Téléphone : {$c['phone']}. E-mail : {$c['email']}." : "العنوان : {$c['address']}، {$c['city']}. الهاتف : {$c['phone']}. البريد : {$c['email']}.",
            '__EDITOR3__' => $fr ? "Directrice de la publication : {$c['lawyer']}." : "مديرة النشر : {$c['lawyer']}.",
            '__CONTACT__' => $c['email'],
            '__RIGHTS2__' => $fr ? "Pour exercer ces droits, écrivez à {$c['email']}. Vous pouvez également saisir l'Instance nationale de protection des données personnelles (INPDP)." : "لممارسة هذه الحقوق، راسل {$c['email']}. ويمكنك أيضاً اللجوء إلى الهيئة الوطنية لحماية المعطيات الشخصية.",
        ]);
    }
}
