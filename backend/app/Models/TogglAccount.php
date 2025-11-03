<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TogglAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'api_token',
    ];

    protected $hidden = [
        'api_token',
    ];
}
