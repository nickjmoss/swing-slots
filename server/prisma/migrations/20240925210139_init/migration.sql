-- CreateTable
CREATE TABLE "club" (
    "id" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "software" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,
    "booking_window" INTEGER NOT NULL,
    "num_of_holes" INTEGER NOT NULL,
    "booking_ids" TEXT[],
    "booking_url" TEXT NOT NULL,

    CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_data" (
    "id" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "address2" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "location_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "club_club_id_key" ON "club"("club_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_course_id_key" ON "course"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_data_club_id_key" ON "location_data"("club_id");

-- AddForeignKey
ALTER TABLE "course" ADD CONSTRAINT "course_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("club_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_data" ADD CONSTRAINT "location_data_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("club_id") ON DELETE RESTRICT ON UPDATE CASCADE;
