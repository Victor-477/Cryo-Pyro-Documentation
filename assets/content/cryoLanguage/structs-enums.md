---
title: "Structs & Enums"
group: "The Cryo Language"
lead: "Records of named fields and sets of constants."
---
## Structs

A `struct` groups typed fields:

```cryo
struct Sensor {
    int    id;
    string name;
    number value;
    bool   active;
}
```

Build with `new` and access fields with `.`:

```cryo
Sensor s1 = new Sensor {
    id:    1,
    name:  "Temperature",
    value: 36.6,
    active: true
};
string name = s1.name;   // "Temperature"
```

> Structs can be **serialized to JSON** with `json_encode` and rebuilt with `json_decode ... as T`. See [Native JSON](#/json).

## Enums

An `enum` defines named constants. A member can be written three ways, and all
three mean the same value:

```cryo
enum Level { LOW, MEDIUM, HIGH }

Level a = Level_HIGH;    // qualified with an underscore
Level b = Level.HIGH;    // qualified with a dot
Level c = HIGH;          // bare, when nothing else declares that name
```

A variable of the same name shadows the member, and a struct field keeps its
own meaning — `p.RED` reads the field even if an enum also declares `RED`.

Members are referenced as `Enum_MEMBER`:

```cryo
enum Level { LOW, MEDIUM, HIGH }

fn descLevel(Level nv) -> string ={
    switch (nv) {
        case Level_HIGH:  return "HIGH";
        case Level_MEDIUM: return "MEDIUM";
        default:          return "LOW";
    }
}

string txt = descLevel(Level_HIGH);
```

## Coverage by backend

Structs work on all backends (with restrictions on `asm`); enums are on go/c/node/pyro. See the [backend matrix](#/backends).
